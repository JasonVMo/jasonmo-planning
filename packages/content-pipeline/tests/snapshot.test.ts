import { afterEach, describe, expect, it, vi } from "vitest";
import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stringify } from "yaml";
import type { Entity } from "@tracker/entity-model";
import { hashBytes, serializeCanonical } from "../src/canonical.ts";
import { compileContent } from "../src/project.ts";
import { RepositoryReader } from "../src/load.ts";
import { reconcileContent, recoverReconciliation } from "../src/reconcile.ts";
import { GENERATION, JOURNAL, LOCK } from "../src/transaction.ts";
import {
  BODY_PATH,
  cleanup,
  ENTITY_PATH,
  fixture,
  proposal,
  read,
  STATE_PATH,
  write,
} from "./fixtures.ts";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, rename: vi.fn(actual.rename) };
});
afterEach(async () => {
  vi.mocked(rename).mockReset();
  vi.restoreAllMocks();
  await cleanup();
});

function signal() {
  let resolve!: () => void;
  const promise = new Promise<void>((fulfill) => {
    resolve = fulfill;
  });
  return { promise, resolve };
}

async function changingProposal(root: string) {
  const entity = await read<Entity>(root, ENTITY_PATH);
  entity.summary = "New coherent descriptor.";
  entity.timestamps.updatedAt = "2026-09-08T10:30:00-07:00";
  const body = (await readFile(join(root, BODY_PATH), "utf8")).replace(
    "Initial state:",
    "New coherent body:",
  );
  return proposal(root, { [ENTITY_PATH]: stringify(entity), [BODY_PATH]: body });
}

function afterOriginalDescriptor(root: string, callback: () => Promise<void>) {
  const original = RepositoryReader.prototype.bytes;
  let fired = false;
  vi.spyOn(RepositoryReader.prototype, "bytes").mockImplementation(async function (
    this: RepositoryReader,
    path: string,
  ) {
    const bytes = await original.call(this, path);
    if (this.root === root && path === ENTITY_PATH && !fired) {
      fired = true;
      await callback();
    }
    return bytes;
  });
  return () => fired;
}

describe("generation-guarded read-only corpus snapshots", () => {
  it("rejects a writer that starts and finishes between descriptor and body reads", async () => {
    const root = await fixture();
    const path = await changingProposal(root);
    const fired = afterOriginalDescriptor(root, async () => {
      await reconcileContent(root, path, { apply: true });
      expect(await new RepositoryReader(root).exists(LOCK)).toBe(false);
    });
    await expect(compileContent(root, { target: "local", basePath: "/" })).rejects.toThrow(
      "generation changed",
    );
    expect(fired()).toBe(true);
    const coherent = await compileContent(root, { target: "local", basePath: "/" });
    const entity = coherent.entities.find((item) => item.id === "tracker-overview")!;
    expect(entity.summary).toBe("New coherent descriptor.");
    expect(entity.viewModels.full?.body).toContain("New coherent body:");
  });

  it("rejects a still-active writer after loading an old descriptor and new body", async () => {
    const root = await fixture();
    const path = await changingProposal(root);
    const reached = signal(),
      release = signal();
    const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    vi.mocked(rename).mockImplementation(async (source, destination) => {
      await actual.rename(source, destination);
      if (destination === join(root, BODY_PATH)) {
        reached.resolve();
        await release.promise;
      }
    });
    let writer: ReturnType<typeof reconcileContent> | undefined;
    afterOriginalDescriptor(root, async () => {
      writer = reconcileContent(root, path, { apply: true });
      await Promise.race([
        reached.promise,
        writer.then(() => {
          throw new Error("Writer finished before pause");
        }),
      ]);
    });
    try {
      await expect(compileContent(root, { target: "local", basePath: "/" })).rejects.toThrow(
        "canonical writer",
      );
      expect(await new RepositoryReader(root).exists(LOCK)).toBe(true);
    } finally {
      release.resolve();
      await writer;
    }
  });

  it("rejects a mixed read even after the interleaved writer rolls back completely", async () => {
    const root = await fixture();
    const path = await changingProposal(root);
    const beforeDescriptor = await readFile(join(root, ENTITY_PATH));
    const beforeBody = await readFile(join(root, BODY_PATH));
    const reached = signal(),
      release = signal();
    const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    let interrupted = false;
    vi.mocked(rename).mockImplementation(async (source, destination) => {
      await actual.rename(source, destination);
      if (destination === join(root, BODY_PATH) && !interrupted) {
        interrupted = true;
        reached.resolve();
        await release.promise;
        throw new Error("Synthetic post-rename interruption");
      }
    });
    const original = RepositoryReader.prototype.bytes;
    let started = false,
      readNewBody = false;
    let outcome: Promise<unknown> | undefined;
    vi.spyOn(RepositoryReader.prototype, "bytes").mockImplementation(async function (
      this: RepositoryReader,
      current: string,
    ) {
      const bytes = await original.call(this, current);
      if (this.root === root && current === ENTITY_PATH && !started) {
        started = true;
        outcome = reconcileContent(root, path, { apply: true }).then(
          () => "unexpected-success",
          (error) => error,
        );
        await Promise.race([
          reached.promise,
          outcome.then(() => {
            throw new Error("Writer missed pause");
          }),
        ]);
      } else if (this.root === root && current === BODY_PATH && interrupted) {
        readNewBody = bytes.toString("utf8").includes("New coherent body:");
      } else if (this.root === root && current === STATE_PATH && readNewBody) {
        release.resolve();
        expect(await outcome).toBeInstanceOf(Error);
      }
      return bytes;
    });
    try {
      await expect(compileContent(root, { target: "local", basePath: "/" })).rejects.toThrow(
        "generation changed",
      );
      expect(readNewBody).toBe(true);
      expect(await readFile(join(root, ENTITY_PATH))).toEqual(beforeDescriptor);
      expect(await readFile(join(root, BODY_PATH))).toEqual(beforeBody);
      expect(await readFile(join(root, GENERATION), "utf8")).toBe("1\n");
      expect(await new RepositoryReader(root).exists(JOURNAL)).toBe(false);
    } finally {
      release.resolve();
      await outcome;
    }
  });

  it("includes recovery writers in the monotonic generation barrier", async () => {
    const root = await fixture();
    const body = await readFile(join(root, BODY_PATH));
    const changed = Buffer.from(
      body.toString("utf8").replace("Initial state:", "Interrupted body:"),
    );
    afterOriginalDescriptor(root, async () => {
      await write(root, JOURNAL, {
        requestKey: "a".repeat(64),
        changes: [
          { path: BODY_PATH, before: body.toString("base64"), afterHash: hashBytes(changed) },
        ],
      });
      await writeFile(join(root, BODY_PATH), changed);
      await recoverReconciliation(root);
    });
    await expect(compileContent(root, { target: "local", basePath: "/" })).rejects.toThrow(
      "generation changed",
    );
    expect(await readFile(join(root, BODY_PATH))).toEqual(body);
    expect(await readFile(join(root, GENERATION), "utf8")).toBe("1\n");
  });

  it("samples generation after the final lease/journal checks", async () => {
    const root = await fixture();
    const path = await changingProposal(root);
    const original = RepositoryReader.prototype.exists;
    let checks = 0,
      fired = false;
    vi.spyOn(RepositoryReader.prototype, "exists").mockImplementation(async function (
      this: RepositoryReader,
      current: string,
    ) {
      const exists = await original.call(this, current);
      if (this.root === root && current === JOURNAL && !fired && ++checks === 2) {
        fired = true;
        await reconcileContent(root, path, { apply: true });
      }
      return exists;
    });
    await expect(compileContent(root, { target: "local", basePath: "/" })).rejects.toThrow(
      "generation changed",
    );
    expect(fired).toBe(true);
  });

  it("keeps compilation read-only and generation outside reproducible browser digests", async () => {
    const root = await fixture();
    const reader = new RepositoryReader(root);
    const before = await compileContent(root, { target: "local", basePath: "/" });
    expect(await reader.exists("research/.local")).toBe(false);
    const body = await readFile(join(root, BODY_PATH), "utf8");
    const path = await proposal(root, { [BODY_PATH]: body }, { outcome: "no-change" });
    await reconcileContent(root, path, { apply: true });
    expect(await readFile(join(root, GENERATION), "utf8")).toBe("1\n");
    expect(serializeCanonical(await compileContent(root, { target: "local", basePath: "/" }))).toBe(
      serializeCanonical(before),
    );
  });
});
