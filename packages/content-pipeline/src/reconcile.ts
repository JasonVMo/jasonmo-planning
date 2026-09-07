import { execFile } from "node:child_process";
import { link, lstat, mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import type { Entity, Proposal, ResearchState } from "@planning/entity-model";
import { digest, hashBytes, serializeCanonical } from "./canonical.ts";
import { fail } from "./diagnostics.ts";
import {
  confinedPath,
  MAX_FILE_BYTES,
  parseStrict,
  RepositoryReader,
  safeRelative,
} from "./load.ts";
import { manualSkeleton, validateEntityEdit } from "./ownership.ts";
import { projectCorpus } from "./project.ts";
import { assertSchema } from "./schema.ts";
import { loadCorpus, type Corpus } from "./validate.ts";
import {
  advanceGeneration,
  beginSnapshot,
  durableWrite,
  finishSnapshot,
  JOURNAL,
  LOCAL,
  LOCK,
  syncDirectory,
} from "./transaction.ts";

const execute = promisify(execFile);

export function requestKey(
  request: Pick<Proposal, "workflow" | "scopeIds" | "baseRevision" | "asOf" | "policyVersion">,
): string {
  return digest({
    workflow: request.workflow,
    scopeIds: [...request.scopeIds].sort(),
    baseRevision: request.baseRevision,
    asOf: request.asOf,
    policyVersion: request.policyVersion,
  });
}

interface PreparedChange {
  path: string;
  before: Buffer | null;
  after: Buffer;
}
interface Journal {
  requestKey: string;
  dispositionDigest?: string;
  changes: { path: string; before: string | null; afterHash: string }[];
}
export interface ReconcileResult {
  status: "validated" | "applied" | "no-change" | "already-applied";
  requestKey: string;
  changedPaths: string[];
  dryRun: boolean;
}

async function removeOwnedDisposition(staging: string, destination: string): Promise<void> {
  try {
    const staged = await lstat(staging);
    const installed = await lstat(destination);
    if (staged.dev === installed.dev && staged.ino === installed.ino) {
      await rm(destination);
      await syncDirectory(dirname(destination));
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function validateProjections(corpus: Corpus): void {
  for (const target of ["local", "private-owner", "private-group", "public"] as const)
    projectCorpus(corpus, { target, basePath: "/" }, false);
  for (const approval of corpus.approvals)
    projectCorpus(corpus, { target: approval.target, basePath: approval.basePath });
}

function durableResearch(bytes: Buffer, path: string): void {
  const text = bytes.toString("utf8");
  if (
    /(?:\/Users\/|\/home\/|[A-Z]:\\Users\\|-----BEGIN .*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|(?:password|access_token|api_key)\s*[:=]\s*\S+)/i.test(
      text,
    )
  )
    fail(
      path,
      "",
      "machine paths, credentials, and raw operational secrets are forbidden in durable research",
    );
  if (/\b(?:system prompt|raw transcript|stack trace)\s*:/i.test(text))
    fail(path, "", "raw transcripts and tool logs are not concise research outcomes");
}

function stateTransition(
  before: ResearchState,
  after: ResearchState,
  proposal: Proposal,
  path: string,
): void {
  for (const field of [
    "lastAttemptAt",
    "lastVerifiedAt",
    "lastSuccessfulRetrievalAt",
    "lastReviewedAt",
  ] as const) {
    if (before[field] && (!after[field] || Date.parse(after[field]) < Date.parse(before[field])))
      fail(path, `/${field}`, "successful/attempt history cannot be removed or move backwards");
    if (after[field] && Date.parse(after[field]) > Date.parse(proposal.asOf))
      fail(path, `/${field}`, "timestamp exceeds requested as-of");
  }
  if (
    after.lastAttemptOutcome &&
    after.lastAttemptOutcome !== proposal.outcome &&
    before.lastAttemptAt !== after.lastAttemptAt
  )
    fail(path, "/lastAttemptOutcome", "state outcome must match proposal");
  if (["failed", "blocked", "partial"].includes(proposal.outcome)) {
    for (const field of [
      "lastVerifiedAt",
      "lastSuccessfulRetrievalAt",
      "completedSubtopics",
    ] as const)
      if (serializeCanonical(before[field] ?? null) !== serializeCanonical(after[field] ?? null))
        fail(path, `/${field}`, "unsuccessful research cannot advance successful evidence");
  }
  if (after.contradictions.length && after.status !== "blocked")
    fail(path, "/status", "contradictions require human review");
}

async function acquireLease(root: string): Promise<string> {
  const local = await confinedPath(root, LOCAL, true);
  await mkdir(local, { recursive: true });
  await syncDirectory(dirname(local));
  const lock = await confinedPath(root, LOCK, true);
  try {
    await mkdir(lock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      fail(LOCK, "", "another writer or interrupted lease exists; owner must inspect before retry");
    throw error;
  }
  await durableWrite(join(lock, "owner.json"), serializeCanonical({ pid: process.pid }));
  return lock;
}

export async function reconcileContent(
  root: string,
  proposalPath: string,
  options: { apply?: boolean } = {},
): Promise<ReconcileResult> {
  safeRelative(proposalPath);
  if (!/^proposals\/[a-z][a-z0-9-]*\/manifest\.(?:json|ya?ml)$/.test(proposalPath))
    fail(proposalPath, "", "proposal must be a normal proposals/<run-id>/manifest JSON/YAML file");
  const reader = new RepositoryReader(root);
  if (await reader.exists(JOURNAL))
    fail(
      JOURNAL,
      "",
      "interrupted promotion requires owner-supervised recoverReconciliation before any further operation",
    );
  const value = await reader.document(proposalPath);
  assertSchema<Proposal>("Proposal", value, proposalPath);
  const proposal = value;
  if (proposalPath.split("/")[1] !== proposal.runId)
    fail(proposalPath, "/runId", "proposal directory must match run ID");
  if (requestKey(proposal) !== proposal.requestKey)
    fail(proposalPath, "/requestKey", "request key does not match immutable request inputs");
  if (new Set(proposal.changes.map((change) => change.path)).size !== proposal.changes.length)
    fail(proposalPath, "/changes", "duplicate target paths");
  const dispositionPath = `${LOCAL}/dispositions/${proposal.requestKey}.json`;
  const proposalDigest = digest(proposal);
  if (await reader.exists(dispositionPath)) {
    const generation = await beginSnapshot(reader);
    const disposition = (await reader.document(dispositionPath)) as {
      proposalDigest?: string;
      changes?: { path: string; afterHash: string }[];
    };
    if (disposition.proposalDigest !== proposalDigest || !Array.isArray(disposition.changes))
      fail(proposalPath, "/requestKey", "request was already used for different proposal content");
    for (const change of disposition.changes)
      if (hashBytes(await reader.bytes(change.path)) !== change.afterHash)
        fail(change.path, "", "previous disposition no longer matches canonical bytes");
    await finishSnapshot(reader, generation);
    return {
      status: "already-applied",
      requestKey: proposal.requestKey,
      changedPaths: [],
      dryRun: !options.apply,
    };
  }
  const corpus = await loadCorpus(root);
  if (proposal.policyVersion !== corpus.publication.policyVersion)
    fail(proposalPath, "/policyVersion", "stale policy version");
  const revision = (await execute("git", ["-C", root, "rev-parse", "HEAD"])).stdout.trim();
  if (revision !== proposal.baseRevision)
    fail(proposalPath, "/baseRevision", "base revision is stale");
  const scoped = corpus.entities.filter((item) => proposal.scopeIds.includes(item.entity.id));
  if (scoped.length !== proposal.scopeIds.length)
    fail(proposalPath, "/scopeIds", "unknown scope entity");
  const changes: PreparedChange[] = [];
  const overlay = new Map<string, Buffer>();
  for (const change of proposal.changes) {
    safeRelative(change.path);
    const source = `${dirname(proposalPath)}/${safeRelative(change.proposedPath)}`;
    if (!change.proposedPath.startsWith("changes/"))
      fail(proposalPath, "/changes/proposedPath", "candidate must live under proposal changes/");
    const after = await reader.bytes(source);
    const before = (await reader.exists(change.path)) ? await reader.bytes(change.path) : null;
    if ((before ? hashBytes(before) : null) !== change.expectedHash)
      fail(change.path, "", "stale expected hash; no changes promoted");
    const item = scoped.find(
      (item) =>
        change.path === item.descriptorPath ||
        change.path === item.bodyPath ||
        change.path.startsWith(`research/topics/${item.entity.id}/`),
    );
    if (!item)
      fail(
        change.path,
        "",
        "target outside declared entity scope; policy, approvals, taxonomy, schemas, deletion and code require owner workflow",
      );
    const policy = corpus.ownership.policies.find(
      (policy) => policy.id === item.entity.ownershipPolicyId,
    )!;
    if (change.path === item.descriptorPath) {
      if (!before) fail(change.path, "", "agents cannot create entities through reconciliation");
      const afterEntity = parseStrict(after.toString("utf8"), change.path);
      assertSchema<Entity>("Entity", afterEntity, change.path);
      validateEntityEdit(item.entity, afterEntity, policy, change.path);
      if (
        ["failed", "blocked", "partial", "no-change"].includes(proposal.outcome) &&
        !before.equals(after)
      )
        fail(
          change.path,
          "",
          "unsuccessful/no-change research cannot rewrite canonical conclusions",
        );
    } else if (change.path === item.bodyPath) {
      if (
        !before ||
        manualSkeleton(before.toString("utf8"), policy, change.path) !==
          manualSkeleton(after.toString("utf8"), policy, change.path)
      )
        fail(change.path, "", "manual text and marker bytes must be preserved");
      if (
        ["failed", "blocked", "partial", "no-change"].includes(proposal.outcome) &&
        !before.equals(after)
      )
        fail(change.path, "", "unsuccessful/no-change research must preserve prior body");
    } else {
      const suffix = change.path.slice(`research/topics/${item.entity.id}/`.length);
      const selector = /^runs\/[a-z][a-z0-9-]*\.yaml$/.test(suffix) ? "runs" : suffix;
      if (!policy.researchFiles.includes(selector as (typeof policy.researchFiles)[number]))
        fail(change.path, "", "research path not allowed by central ownership policy");
      if (selector === "runs" && (suffix !== `runs/${proposal.runId}.yaml` || before))
        fail(change.path, "", "run outcomes are append-only and bound to proposal run ID");
      durableResearch(after, change.path);
      if (suffix === "state.yaml") {
        const state = parseStrict(after.toString("utf8"), change.path);
        assertSchema<ResearchState>("ResearchState", state, change.path);
        stateTransition(item.state, state, proposal, change.path);
      }
    }
    overlay.set(change.path, after);
    changes.push({ path: change.path, before, after });
  }
  const candidate = await loadCorpus(root, overlay);
  for (const item of candidate.entities) {
    const previous = corpus.entities.find((before) => before.entity.id === item.entity.id)!;
    const meaning = (entity: Entity, body: string) => ({
      summary: entity.summary,
      provenance: entity.provenance,
      relationships: entity.relationships,
      body,
    });
    const changedMeaning =
      digest(meaning(previous.entity, previous.body)) !== digest(meaning(item.entity, item.body));
    const timestampChanged =
      item.entity.timestamps.updatedAt !== previous.entity.timestamps.updatedAt;
    if (changedMeaning !== timestampChanged)
      fail(
        item.entity.id,
        "/timestamps/updatedAt",
        changedMeaning
          ? "meaningful changes require a new content timestamp"
          : "unchanged conclusions must retain meaningful-content timestamp",
      );
    if (Date.parse(item.entity.timestamps.updatedAt) > Date.parse(proposal.asOf))
      fail(item.entity.id, "/timestamps/updatedAt", "content timestamp exceeds requested as-of");
    if (previous.state.lastVerifiedAt !== item.state.lastVerifiedAt) {
      const run = item.runs.find((run) => run.requestKey === proposal.requestKey);
      if (
        !run ||
        !["succeeded", "no-change"].includes(run.outcome) ||
        !run.sourceEvidence.length ||
        run.endedAt !== item.state.lastVerifiedAt ||
        run.baseRevision !== proposal.baseRevision
      )
        fail(
          item.entity.id,
          "/lastVerifiedAt",
          "new verification requires matching successful evidenced run, not a fabricated timestamp",
        );
    }
    for (const run of item.runs.filter((run) => run.runId === proposal.runId))
      if (
        run.requestKey !== proposal.requestKey ||
        run.outcome !== proposal.outcome ||
        run.workflow !== proposal.workflow
      )
        fail(item.entity.id, "/runs", "run metadata must match proposal");
  }
  validateProjections(candidate);
  const changed = changes.filter((change) => !change.before?.equals(change.after));
  const dispositionBytes = serializeCanonical({
    requestKey: proposal.requestKey,
    proposalDigest,
    changes: changes.map((change) => ({ path: change.path, afterHash: hashBytes(change.after) })),
  });
  const journal: Journal = {
    requestKey: proposal.requestKey,
    dispositionDigest: hashBytes(dispositionBytes),
    changes: changed.map((change) => ({
      path: change.path,
      before: change.before?.toString("base64") ?? null,
      afterHash: hashBytes(change.after),
    })),
  };
  if (Buffer.byteLength(serializeCanonical(journal)) > MAX_FILE_BYTES)
    fail(
      proposalPath,
      "/changes",
      "transaction recovery journal exceeds 256 KiB; reduce supervised proposal scope",
    );
  const result: ReconcileResult = {
    status: changed.length ? "validated" : "no-change",
    requestKey: proposal.requestKey,
    changedPaths: changed.map((change) => change.path),
    dryRun: !options.apply,
  };
  if (!options.apply) return result;
  const lock = await acquireLease(root);
  const journalPath = await confinedPath(root, JOURNAL, true);
  const disposition = await confinedPath(root, dispositionPath, true);
  const dispositionStaging = join(lock, "disposition.json");
  const promoted: PreparedChange[] = [];
  let unsettled = false;
  try {
    const current = new RepositoryReader(root);
    for (const change of changes) {
      const actual = (await current.exists(change.path)) ? await current.bytes(change.path) : null;
      if ((actual ? hashBytes(actual) : null) !== (change.before ? hashBytes(change.before) : null))
        fail(change.path, "", "hash changed while acquiring writer lease");
    }
    const lockedCandidate = await loadCorpus(root, overlay, true);
    if (
      digest(lockedCandidate.ownership) !== digest(corpus.ownership) ||
      digest(lockedCandidate.publication) !== digest(corpus.publication)
    )
      fail("references", "", "policy changed while acquiring writer lease");
    validateProjections(lockedCandidate);
    await durableWrite(journalPath, serializeCanonical(journal));
    await syncDirectory(dirname(journalPath));
    unsettled = true;
    await advanceGeneration(root, lock);
    for (const [index, change] of changed.entries()) {
      const target = await confinedPath(root, change.path, true);
      await mkdir(dirname(target), { recursive: true });
      const staging = join(lock, `candidate-${index}`);
      await durableWrite(staging, change.after);
      promoted.push(change);
      await rename(staging, target);
      await syncDirectory(dirname(target));
    }
    await loadCorpus(root, undefined, true);
    await mkdir(dirname(disposition), { recursive: true });
    await syncDirectory(dirname(dirname(disposition)));
    await durableWrite(dispositionStaging, dispositionBytes);
    // Publish complete synced bytes without replacing an unknown existing disposition.
    await link(dispositionStaging, disposition);
    await syncDirectory(dirname(disposition));
    await rm(journalPath);
    await syncDirectory(dirname(journalPath));
    unsettled = false;
    return { ...result, status: changed.length ? "applied" : "no-change", dryRun: false };
  } catch (error) {
    for (const [index, change] of promoted.reverse().entries()) {
      const target = await confinedPath(root, change.path, true);
      if (change.before) {
        const rollback = join(lock, `rollback-${index}`);
        await durableWrite(rollback, change.before);
        await rename(rollback, target);
      } else await rm(target, { force: true });
      await syncDirectory(dirname(target));
    }
    await removeOwnedDisposition(dispositionStaging, disposition);
    await rm(journalPath, { force: true });
    unsettled = false;
    throw error;
  } finally {
    if (!unsettled) await rm(lock, { recursive: true, force: true });
  }
}

// Owner-only recovery: refuses to overwrite unrelated edits after interruption.
export async function recoverReconciliation(root: string): Promise<void> {
  const reader = new RepositoryReader(root);
  if (await reader.exists(LOCK))
    fail(LOCK, "", "inspect the writer PID and remove the stale lease before explicit recovery");
  if (!(await reader.exists(JOURNAL))) throw new Error("No interrupted reconciliation journal");
  const lock = await acquireLease(root);
  let unsettled = false;
  try {
    const journal = (await reader.document(JOURNAL)) as Journal;
    if (
      !journal ||
      !/^[a-f0-9]{64}$/.test(journal.requestKey) ||
      (journal.dispositionDigest !== undefined &&
        !/^[a-f0-9]{64}$/.test(journal.dispositionDigest)) ||
      !Array.isArray(journal.changes) ||
      journal.changes.length > 100
    )
      throw new Error("Invalid recovery journal");
    for (const change of journal.changes) {
      if (
        !change ||
        typeof change.path !== "string" ||
        typeof change.afterHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(change.afterHash) ||
        (change.before !== null &&
          (typeof change.before !== "string" ||
            !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
              change.before,
            )))
      )
        throw new Error("Invalid recovery entry");
      if (!/^(?:content\/entities|research\/topics)\//.test(safeRelative(change.path)))
        throw new Error("Unsafe recovery target");
      const current = (await reader.exists(change.path))
        ? hashBytes(await reader.bytes(change.path))
        : null;
      const previous =
        change.before === null ? null : hashBytes(Buffer.from(change.before, "base64"));
      if (current !== previous && current !== change.afterHash)
        fail(change.path, "", "recovery conflicts with an unrelated edit");
    }
    if (new Set(journal.changes.map((change) => change.path)).size !== journal.changes.length)
      throw new Error("Duplicate recovery target");
    const disposition = `${LOCAL}/dispositions/${journal.requestKey}.json`;
    const checkDisposition = async () => {
      if (await reader.exists(disposition)) {
        if (
          !journal.dispositionDigest ||
          hashBytes(await reader.bytes(disposition)) !== journal.dispositionDigest
        )
          fail(disposition, "", "recovery will not remove an unknown disposition");
        return true;
      }
      return false;
    };
    await checkDisposition();
    await advanceGeneration(root, lock);
    unsettled = true;
    for (const [index, change] of journal.changes.entries()) {
      const target = await confinedPath(root, change.path, true);
      if (change.before === null) await rm(target, { force: true });
      else {
        const staging = join(lock, `recover-${index}`);
        await durableWrite(staging, Buffer.from(change.before, "base64"));
        await rename(staging, target);
      }
      await syncDirectory(dirname(target));
    }
    await loadCorpus(root, undefined, true);
    if (await checkDisposition()) {
      const path = await confinedPath(root, disposition);
      await rm(path);
      await syncDirectory(dirname(path));
    }
    const journalPath = await confinedPath(root, JOURNAL);
    await rm(journalPath);
    await syncDirectory(dirname(journalPath));
    unsettled = false;
  } finally {
    if (!unsettled) await rm(lock, { recursive: true, force: true });
  }
}
