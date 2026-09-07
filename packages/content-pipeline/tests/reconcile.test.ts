import { afterEach, describe, expect, it, vi } from "vitest";
import { link, mkdir, open, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { stringify } from "yaml";
import type { Entity, Proposal, ResearchState, RunOutcome } from "@planning/entity-model";
import { hashBytes, serializeCanonical } from "../src/canonical.ts";
import { reconcileContent, recoverReconciliation, requestKey } from "../src/reconcile.ts";
import { validateContent } from "../src/validate.ts";
import { parseArgs, main } from "../src/cli.ts";
import { reports } from "../src/reports.ts";
import { RepositoryReader } from "../src/load.ts";
import { GENERATION, JOURNAL, LOCK } from "../src/transaction.ts";
import {
  BODY_PATH,
  cleanup,
  ENTITY_ID,
  ENTITY_PATH,
  fixture,
  proposal,
  read,
  STATE_PATH,
  write,
} from "./fixtures.ts";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    rename: vi.fn(actual.rename),
    open: vi.fn(actual.open),
    link: vi.fn(actual.link),
  };
});
afterEach(async () => {
  vi.mocked(rename).mockReset();
  vi.mocked(open).mockReset();
  vi.mocked(link).mockReset();
  vi.restoreAllMocks();
  await cleanup();
});
async function changedSummary(root: string) {
  const entity = await read<Entity>(root, ENTITY_PATH);
  entity.summary = "Synthetic supervised summary update.";
  entity.timestamps.updatedAt = "2026-09-08T10:30:00-07:00";
  return stringify(entity);
}
describe("supervised reconciliation", () => {
  it("is dry-run by default, promotes explicitly, and resumes same request without a diff", async () => {
    const root = await fixture();
    const original = await readFile(join(root, ENTITY_PATH));
    const path = await proposal(root, { [ENTITY_PATH]: await changedSummary(root) });
    expect((await reconcileContent(root, path)).status).toBe("validated");
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(original);
    expect((await reconcileContent(root, path, { apply: true })).status).toBe("applied");
    const applied = await readFile(join(root, ENTITY_PATH));
    expect((await reconcileContent(root, path, { apply: true })).status).toBe("already-applied");
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(applied);
  });
  it("reports a same-content proposal as no-change without mutating canonical bytes", async () => {
    const root = await fixture();
    const original = await readFile(join(root, BODY_PATH), "utf8");
    const path = await proposal(root, { [BODY_PATH]: original }, { outcome: "no-change" });
    expect((await reconcileContent(root, path, { apply: true })).status).toBe("no-change");
    expect((await reconcileContent(root, path, { apply: true })).status).toBe("already-applied");
  });
  it("rejects stale hashes and two concurrent proposals on one entity", async () => {
    const root = await fixture();
    const path = await proposal(root, { [ENTITY_PATH]: await changedSummary(root) });
    const other = await proposal(
      root,
      { [ENTITY_PATH]: await changedSummary(root) },
      { runId: "other-run", asOf: "2026-09-09T10:30:00-07:00" },
    );
    await reconcileContent(root, path, { apply: true });
    await expect(reconcileContent(root, other, { apply: true })).rejects.toThrow(
      "stale expected hash",
    );
  });
  it("preserves manual text, marker bytes, sensitivity and central ownership", async () => {
    const root = await fixture();
    const original = await readFile(join(root, BODY_PATH), "utf8");
    const path = await proposal(root, {
      [BODY_PATH]: original.replace(
        "owner-maintained introduction",
        "agent-overwritten introduction",
      ),
    });
    await expect(reconcileContent(root, path, { apply: true })).rejects.toThrow("manual text");
    const entity = await read<Entity>(root, ENTITY_PATH);
    entity.sensitivity.classification = "public";
    const sensitivity = await proposal(
      root,
      { [ENTITY_PATH]: stringify(entity) },
      { runId: "sensitivity-run" },
    );
    await expect(reconcileContent(root, sensitivity, { apply: true })).rejects.toThrow(
      "owner-controlled",
    );
    const policy = await proposal(
      root,
      { "references/ownership/policies.yaml": "schemaVersion: 1\npolicies: []\n" },
      { runId: "self-authorize" },
    );
    await expect(reconcileContent(root, policy, { apply: true })).rejects.toThrow(
      "outside declared",
    );
  });
  it("updates an authorized body region only with a meaningful-content timestamp", async () => {
    const root = await fixture();
    const body = await readFile(join(root, BODY_PATH), "utf8");
    const entity = await read<Entity>(root, ENTITY_PATH);
    entity.timestamps.updatedAt = "2026-09-08T10:30:00-07:00";
    const replacement = body.replace("Initial state:", "Synthetic managed summary state:");
    const path = await proposal(root, {
      [ENTITY_PATH]: stringify(entity),
      [BODY_PATH]: replacement,
    });
    await reconcileContent(root, path, { apply: true });
    expect(await readFile(join(root, BODY_PATH), "utf8")).toBe(replacement);
  });
  it("does not partially promote when the isolated complete candidate fails", async () => {
    const root = await fixture();
    const entity = await changedSummary(root);
    const original = await readFile(join(root, ENTITY_PATH));
    const body = (await readFile(join(root, BODY_PATH), "utf8")).replace(
      "Initial state:",
      "<script>unsafe</script>\n\nInitial state:",
    );
    const path = await proposal(root, { [ENTITY_PATH]: entity, [BODY_PATH]: body });
    await expect(reconcileContent(root, path, { apply: true })).rejects.toThrow("HTML");
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(original);
  });
  it("rolls back every previously replaced file on a promotion I/O failure", async () => {
    const root = await fixture();
    const original = await readFile(join(root, ENTITY_PATH));
    const body = await readFile(join(root, BODY_PATH), "utf8");
    const path = await proposal(root, {
      [ENTITY_PATH]: await changedSummary(root),
      [BODY_PATH]: body.replace("Initial state:", "Synthetic amended initial state:"),
    });
    const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    let failed = false;
    vi.mocked(rename).mockImplementation(async (source, destination) => {
      if (destination === join(root, BODY_PATH) && !failed) {
        failed = true;
        throw new Error("Synthetic second-file I/O failure");
      }
      await actual.rename(source, destination);
    });
    await expect(reconcileContent(root, path, { apply: true })).rejects.toThrow(
      "Synthetic second-file",
    );
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(original);
    expect(await readFile(join(root, BODY_PATH), "utf8")).toBe(body);
    expect(failed).toBe(true);
    expect(await readFile(join(root, GENERATION), "utf8")).toBe("1\n");
    await expect(validateContent(root)).resolves.toBeUndefined();
  });
  it.each(["write", "sync", "directory-sync"] as const)(
    "keeps failed disposition %s private and permits a successful retry",
    async (fault) => {
      const root = await fixture();
      const original = await readFile(join(root, ENTITY_PATH));
      const path = await proposal(root, { [ENTITY_PATH]: await changedSummary(root) });
      const manifest = await read<Proposal>(root, path);
      const disposition = `research/.local/dispositions/${manifest.requestKey}.json`;
      const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
      let injected = false;
      vi.mocked(open).mockImplementation(async (...args) => {
        const file = await actual.open(...args);
        const failurePath =
          fault === "directory-sync"
            ? join(root, "research/.local/dispositions")
            : join(root, LOCK, "disposition.json");
        if (args[0] === failurePath && !injected) {
          injected = true;
          if (fault === "write") {
            const write = file.writeFile.bind(file);
            vi.spyOn(file, "writeFile").mockImplementationOnce(async () => {
              await write('{"incomplete":');
              throw new Error("Synthetic disposition write failure");
            });
          } else
            vi.spyOn(file, "sync").mockRejectedValueOnce(
              new Error(`Synthetic disposition ${fault} failure`),
            );
        }
        return file;
      });
      await expect(reconcileContent(root, path, { apply: true })).rejects.toThrow(
        `disposition ${fault}`,
      );
      expect(injected).toBe(true);
      expect(await readFile(join(root, ENTITY_PATH))).toEqual(original);
      const reader = new RepositoryReader(root);
      for (const absent of [disposition, LOCK, JOURNAL])
        expect(await reader.exists(absent)).toBe(false);
      expect(await readFile(join(root, GENERATION), "utf8")).toBe("1\n");
      expect((await reconcileContent(root, path, { apply: true })).status).toBe("applied");
      expect((await reconcileContent(root, path, { apply: true })).status).toBe("already-applied");
      expect(await readFile(join(root, GENERATION), "utf8")).toBe("2\n");
    },
  );
  it("keeps readers blocked if a late commit failure is followed by a rollback failure", async () => {
    const root = await fixture();
    const path = await proposal(root, { [ENTITY_PATH]: await changedSummary(root) });
    const manifest = await read<Proposal>(root, path);
    const reader = new RepositoryReader(root);
    const disposition = `research/.local/dispositions/${manifest.requestKey}.json`;
    const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    let failedCommit = false;
    vi.mocked(open).mockImplementation(async (...args) => {
      const file = await actual.open(...args);
      if (
        args[0] === join(root, "research/.local") &&
        !failedCommit &&
        !(await reader.exists(JOURNAL)) &&
        (await reader.exists(disposition))
      ) {
        failedCommit = true;
        vi.spyOn(file, "sync").mockRejectedValueOnce(new Error("Synthetic late commit failure"));
      }
      return file;
    });
    vi.mocked(rename).mockImplementation(async (source, destination) => {
      if (String(source).includes("rollback-")) throw new Error("Synthetic rollback failure");
      await actual.rename(source, destination);
    });
    await expect(reconcileContent(root, path, { apply: true })).rejects.toThrow("rollback failure");
    expect(failedCommit).toBe(true);
    expect(await reader.exists(LOCK)).toBe(true);
    await expect(validateContent(root)).rejects.toThrow("canonical writer");
  });
  it("preserves an unknown disposition that appears before atomic installation", async () => {
    const root = await fixture();
    const original = await readFile(join(root, ENTITY_PATH));
    const path = await proposal(root, { [ENTITY_PATH]: await changedSummary(root) });
    const manifest = await read<Proposal>(root, path);
    const disposition = `research/.local/dispositions/${manifest.requestKey}.json`;
    const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    vi.mocked(link).mockImplementationOnce(async (source, destination) => {
      await writeFile(destination, "unknown owner file", { flag: "wx" });
      await actual.link(source, destination);
    });
    await expect(reconcileContent(root, path, { apply: true })).rejects.toThrow("EEXIST");
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(original);
    expect(await readFile(join(root, disposition), "utf8")).toBe("unknown owner file");
    expect(await new RepositoryReader(root).exists(JOURNAL)).toBe(false);
  });
  it("does not erase an unknown disposition during recovery", async () => {
    const root = await fixture();
    const before = await readFile(join(root, ENTITY_PATH));
    const after = Buffer.from(await changedSummary(root));
    const request = "a".repeat(64);
    const disposition = `research/.local/dispositions/${request}.json`;
    await write(root, JOURNAL, {
      requestKey: request,
      dispositionDigest: hashBytes("expected disposition"),
      changes: [
        { path: ENTITY_PATH, before: before.toString("base64"), afterHash: hashBytes(after) },
      ],
    });
    await writeFile(join(root, ENTITY_PATH), after);
    await write(root, disposition, { unknown: "owner file" });
    const unknown = await readFile(join(root, disposition));
    await expect(recoverReconciliation(root)).rejects.toThrow("unknown disposition");
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(after);
    expect(await readFile(join(root, disposition))).toEqual(unknown);
    expect(await new RepositoryReader(root).exists(JOURNAL)).toBe(true);
  });
  it.each(["failed", "blocked", "partial"] as const)(
    "records %s attempt without changing previous conclusions or successful clocks",
    async (outcome) => {
      const root = await fixture();
      const before = await readFile(join(root, ENTITY_PATH));
      const state = await read<ResearchState>(root, STATE_PATH);
      state.lastAttemptAt = "2026-09-08T10:30:00-07:00";
      state.lastAttemptOutcome = outcome;
      state.status = "blocked";
      state.nextAction =
        outcome === "blocked"
          ? "Authentication failed; owner must restore approved access. Do not switch identities."
          : "Source unavailable or partial; preserve prior content and retry after owner review.";
      state.retryAfter = "2026-09-09T10:30:00-07:00";
      const path = await proposal(root, { [STATE_PATH]: stringify(state) }, { outcome });
      await reconcileContent(root, path, { apply: true });
      expect(await readFile(join(root, ENTITY_PATH))).toEqual(before);
      expect((await read<ResearchState>(root, STATE_PATH)).lastVerifiedAt).toBeUndefined();
    },
  );
  it("rejects source failure claiming new successful verification", async () => {
    const root = await fixture();
    const state = await read<ResearchState>(root, STATE_PATH);
    state.lastAttemptAt = "2026-09-08T10:30:00-07:00";
    state.lastAttemptOutcome = "failed";
    state.lastVerifiedAt = state.lastAttemptAt;
    state.lastSuccessfulRetrievalAt = state.lastAttemptAt;
    const path = await proposal(root, { [STATE_PATH]: stringify(state) }, { outcome: "failed" });
    await expect(reconcileContent(root, path, { apply: true })).rejects.toThrow("unsuccessful");
  });
  it("supports later evidenced verification without rewriting unchanged conclusions", async () => {
    const root = await fixture();
    const before = await readFile(join(root, ENTITY_PATH));
    const state = await read<ResearchState>(root, STATE_PATH);
    const asOf = "2026-09-08T10:30:00-07:00";
    state.lastAttemptAt = asOf;
    state.lastAttemptOutcome = "no-change";
    state.lastSuccessfulRetrievalAt = asOf;
    state.lastVerifiedAt = asOf;
    const path = await proposal(root, {}, { outcome: "no-change", asOf });
    const manifest = await read<Proposal>(root, path);
    const source = {
      id: "synthetic-primary",
      title: "Synthetic test source",
      publisher: "Fixture publisher",
      sourceType: "primary-documentation",
      url: "https://example.com/synthetic",
      access: "public",
      retrievedAt: asOf,
      fingerprint: "a".repeat(64),
    };
    const run: RunOutcome = {
      schemaVersion: 1,
      runId: manifest.runId,
      workflow: manifest.workflow,
      baseRevision: manifest.baseRevision,
      requestKey: manifest.requestKey,
      scopeIds: [ENTITY_ID],
      sourceEvidence: [{ sourceId: source.id, retrievedAt: asOf, fingerprint: source.fingerprint }],
      changedEntityIds: [],
      validation: "Synthetic fixture only; not a real research cycle.",
      startedAt: asOf,
      endedAt: asOf,
      outcome: "no-change",
      reviewItems: [],
      continuation: "Real supervised source cycle remains pending.",
    };
    await proposal(
      root,
      {
        [STATE_PATH]: stringify(state),
        [`research/topics/${ENTITY_ID}/sources.yaml`]: stringify({
          schemaVersion: 1,
          entityId: ENTITY_ID,
          sources: [source],
        }),
        [`research/topics/${ENTITY_ID}/runs/${manifest.runId}.yaml`]: stringify(run),
      },
      { outcome: "no-change", asOf },
    );
    await reconcileContent(root, path, { apply: true });
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(before);
    expect((await read<ResearchState>(root, STATE_PATH)).lastVerifiedAt).toBe(asOf);
  });
  it("requires contradiction review and rejects raw credential/machine-path research", async () => {
    const root = await fixture();
    const state = await read<ResearchState>(root, STATE_PATH);
    state.contradictions = ["Synthetic sources disagree."];
    const path = await proposal(root, { [STATE_PATH]: stringify(state) }, { outcome: "blocked" });
    await expect(reconcileContent(root, path)).rejects.toThrow("contradictions");
    const secret = await proposal(
      root,
      { [`research/topics/${ENTITY_ID}/evidence.md`]: "api_key: synthetic-forbidden-credential" },
      { runId: "unsafe-evidence" },
    );
    await expect(reconcileContent(root, secret)).rejects.toThrow("credentials");
  });
  it("blocks readers on interrupted promotion and restores exact originals through supervised recovery", async () => {
    const root = await fixture();
    const before = await readFile(join(root, ENTITY_PATH));
    const after = Buffer.from(await changedSummary(root));
    const journal = "research/.local/reconcile-journal.json";
    await write(root, journal, {
      requestKey: "a".repeat(64),
      changes: [
        { path: ENTITY_PATH, before: before.toString("base64"), afterHash: hashBytes(after) },
      ],
    });
    await writeFile(join(root, ENTITY_PATH), after);
    await expect(validateContent(root)).rejects.toThrow("interrupted");
    await recoverReconciliation(root);
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(before);
    await expect(validateContent(root)).resolves.toBeUndefined();
  });
  it("rejects same-request changed content and stale base revision", async () => {
    const root = await fixture();
    const path = await proposal(root, { [ENTITY_PATH]: await changedSummary(root) });
    const value = await read<Proposal>(root, path);
    value.baseRevision = "0".repeat(40);
    value.requestKey = requestKey(value);
    await write(root, path, value);
    await expect(reconcileContent(root, path)).rejects.toThrow("base revision");
  });
});

describe("strict operational CLI", () => {
  it.each(
    [
      [],
      ["publish"],
      ["compile", "--target", "outside"],
      ["compile", "--wat"],
      ["compile", "--target"],
      ["compile", "--target", "local", "--target", "public"],
      ["due"],
      ["reports", "--as-of"],
      ["reconcile", "--proposal", "proposals/x/manifest.yaml", "--apply", "--dry-run"],
      ["validate", "--apply"],
    ].map((args) => ({ args })),
  )("rejects malformed args $args", ({ args }) => {
    expect(() => parseArgs(args)).toThrow();
  });
  it("reports explicit-time freshness without advancing state", async () => {
    const root = await fixture();
    const before = await readFile(join(root, STATE_PATH));
    const result = await reports(root, "2026-09-15T10:30:00-07:00");
    expect(result.freshness.every((item) => item.freshness === "unverified")).toBe(true);
    expect(result.maintenance.supervisedRealResearchCycles).toBe("pending-owner-supervision");
    expect(await readFile(join(root, STATE_PATH))).toEqual(before);
    await expect(reports(root, "2026-09-15")).rejects.toThrow("Timestamp");
  });
  it("separates compiled audience output and preserves last good manifest on failure", async () => {
    const root = await fixture();
    await main(["compile", "--root", root, "--target", "local", "--base-path", "/tracker/"]);
    await main(["compile", "--root", root, "--target", "private-owner"]);
    const local = join(root, "apps/site/.generated/local/manifest.json");
    const before = await readFile(local);
    const marker = join(root, "apps/site/.generated/public/manifest.json");
    await mkdir(dirname(marker), { recursive: true });
    await writeFile(marker, "last valid broader artifact");
    await expect(main(["compile", "--root", root, "--target", "public"])).rejects.toThrow("exact");
    expect(await readFile(local)).toEqual(before);
    expect(await readFile(marker, "utf8")).toBe("last valid broader artifact");
    expect(
      serializeCanonical(await read(root, "apps/site/.generated/private-owner/manifest.json")),
    ).not.toEqual(before.toString("utf8"));
  });
});
