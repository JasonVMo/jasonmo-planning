import { open, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fail } from "./diagnostics.ts";
import { confinedPath, RepositoryReader } from "./load.ts";

export const LOCAL = "research/.local";
export const LOCK = `${LOCAL}/reconcile.lock`;
export const JOURNAL = `${LOCAL}/reconcile-journal.json`;
export const GENERATION = `${LOCAL}/reconcile-generation`;

export async function durableWrite(path: string, bytes: string | Buffer): Promise<void> {
  const file = await open(path, "wx", 0o600);
  try {
    await file.writeFile(bytes);
    await file.sync();
  } finally {
    await file.close();
  }
}

export async function syncDirectory(path: string): Promise<void> {
  const directory = await open(path, "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}

export async function readGeneration(reader: RepositoryReader): Promise<string> {
  if (!(await reader.exists(GENERATION))) return "0";
  const value = await reader.text(GENERATION);
  if (!/^(?:0|[1-9][0-9]{0,99})\n$/.test(value))
    fail(GENERATION, "", "invalid transaction generation");
  return value.trim();
}

async function requireQuiescent(reader: RepositoryReader): Promise<void> {
  if ((await reader.exists(LOCK)) || (await reader.exists(JOURNAL)))
    fail(
      LOCAL,
      "",
      "canonical writer or interrupted transaction present; reconcile/recover before reading",
    );
}

export async function beginSnapshot(
  reader: RepositoryReader,
  internalWriter = false,
): Promise<string> {
  // Sample before the initial lease check so a completed writer cannot disappear unnoticed.
  const generation = await readGeneration(reader);
  if (!internalWriter) await requireQuiescent(reader);
  return generation;
}

export async function finishSnapshot(
  reader: RepositoryReader,
  generation: string,
  internalWriter = false,
): Promise<void> {
  if (!internalWriter) await requireQuiescent(reader);
  // Sample after the final lease check; writers advance durably before touching canonical files.
  if (generation !== (await readGeneration(reader)))
    fail(
      GENERATION,
      "",
      "canonical generation changed during load; no consistent snapshot returned",
    );
}

export async function advanceGeneration(root: string, lock: string): Promise<void> {
  const reader = new RepositoryReader(root);
  const next = (BigInt(await readGeneration(reader)) + 1n).toString();
  if (next.length > 100) fail(GENERATION, "", "transaction generation exhausted");
  const staging = join(lock, "generation.next");
  const destination = await confinedPath(root, GENERATION, true);
  await durableWrite(staging, `${next}\n`);
  await rename(staging, destination);
  await syncDirectory(dirname(destination));
}
