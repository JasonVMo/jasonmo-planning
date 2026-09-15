import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import type { Entity, Proposal, PublicationPolicy, ResearchState } from "@planning/entity-model";
import { execFileSync } from "node:child_process";
import { hashBytes, serializeCanonical } from "../src/canonical.ts";
import { parseStrict } from "../src/load.ts";
import { requestKey } from "../src/reconcile.ts";

export const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
export const ENTITY_ID = "tracker-overview";
export const ENTITY_PATH = `content/entities/${ENTITY_ID}/entity.yaml`;
export const BODY_PATH = `content/entities/${ENTITY_ID}/body.md`;
export const STATE_PATH = `research/topics/${ENTITY_ID}/state.yaml`;
export const CANARY = "SYNTHETIC-PRIVATE-CANARY-9e5c";
const active = new Set<string>();

export async function fixture(): Promise<string> {
  const root = join(ROOT, "research/.local", `test-${randomUUID()}`);
  await mkdir(root, { recursive: true });
  for (const path of [
    "content/entities/tracker-overview",
    "content/entities/tracker-data-view-architecture",
    "references/taxonomy.yaml",
    "references/ownership",
    "references/publication/policy.yaml",
    "research/topics/tracker-overview",
    "research/topics/tracker-data-view-architecture",
  ]) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await cp(join(ROOT, path), join(root, path), { recursive: true });
  }
  await mkdir(join(root, "references/publication/approvals"), { recursive: true });
  active.add(root);
  return root;
}
export async function cleanup(): Promise<void> {
  for (const path of active) await rm(path, { recursive: true, force: true });
  active.clear();
}
export async function read<T>(root: string, path: string): Promise<T> {
  return parseStrict(await readFile(join(root, path), "utf8"), path) as T;
}
export async function write(root: string, path: string, value: unknown): Promise<void> {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(
    join(root, path),
    path.endsWith(".json") ? serializeCanonical(value) : stringify(value),
  );
}
export async function editEntity(root: string, edit: (entity: Entity) => void): Promise<void> {
  const entity = await read<Entity>(root, ENTITY_PATH);
  edit(entity);
  await write(root, ENTITY_PATH, entity);
}
export async function editState(root: string, edit: (state: ResearchState) => void): Promise<void> {
  const state = await read<ResearchState>(root, STATE_PATH);
  edit(state);
  await write(root, STATE_PATH, state);
}
export async function proposal(
  root: string,
  changed: Record<string, string>,
  options: Partial<Proposal> = {},
): Promise<string> {
  const runId = options.runId ?? "synthetic-test-run";
  const baseRevision = execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const policy = await read<PublicationPolicy>(root, "references/publication/policy.yaml");
  const result: Proposal = {
    schemaVersion: 1,
    runId,
    workflow: "research-topic",
    baseRevision,
    requestKey: "",
    scopeIds: [ENTITY_ID],
    asOf: "2026-09-08T10:30:00-07:00",
    policyVersion: policy.policyVersion,
    outcome: "succeeded",
    changes: [],
    ...options,
  };
  result.requestKey = requestKey(result);
  for (const [path, after] of Object.entries(changed)) {
    let before: Buffer | null;
    try {
      before = await readFile(join(root, path));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      before = null;
    }
    const proposedPath = `changes/${path}`;
    await mkdir(dirname(join(root, "proposals", runId, proposedPath)), { recursive: true });
    await writeFile(join(root, "proposals", runId, proposedPath), after);
    result.changes.push({ path, expectedHash: before ? hashBytes(before) : null, proposedPath });
  }
  const path = `proposals/${runId}/manifest.yaml`;
  await write(root, path, result);
  return path;
}
