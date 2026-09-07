import { afterEach, describe, expect, it } from "vitest";
import { readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Entity, ResearchState, RunOutcome, Taxonomy } from "@tracker/entity-model";
import { parseStrict } from "../src/load.ts";
import { hashBytes, serializeCanonical } from "../src/canonical.ts";
import { validateContent } from "../src/validate.ts";
import { compileContent } from "../src/project.ts";
import { assertSchema } from "../src/schema.ts";
import {
  cleanup,
  editEntity,
  editState,
  ENTITY_PATH,
  BODY_PATH,
  ENTITY_ID,
  STATE_PATH,
  fixture,
  read,
  write,
} from "./fixtures.ts";

afterEach(cleanup);
describe("strict persisted contracts", () => {
  it("accepts linked seed corpus without fabricating successful verification", async () => {
    const root = await fixture();
    await expect(validateContent(root)).resolves.toBeUndefined();
  });
  it("normalizes YAML and JSON equivalently with deterministic object ordering", () => {
    expect(serializeCanonical(parseStrict("z: 2\na: hello\n", "x.yaml"))).toBe(
      serializeCanonical(parseStrict('{"a":"hello","z":2}', "x.json")),
    );
    expect(() => serializeCanonical({ now: new Date() })).toThrow("plain JSON");
    expect(() => serializeCanonical({ missing: undefined })).toThrow("JSON-compatible");
  });
  it.each([
    ["a: 1\na: 2", "yaml"],
    ['{"a":1,"a":2}', "json"],
    ["a: &id hello\nb: *id", "yaml"],
    ["a: !!str value", "yaml"],
    ["a: !custom value", "yaml"],
    ["a: 1\n---\nb: 2", "yaml"],
    ["a:\n  <<: {b: 1}", "yaml"],
    ["1: value", "yaml"],
    ["a: .inf", "yaml"],
    ["a: .nan", "yaml"],
    ["__proto__: {polluted: true}", "yaml"],
    ['{"a": undefined}', "json"],
  ])("rejects unsafe parser input %s", (value, extension) => {
    expect(() => parseStrict(value, `input.${extension}`)).toThrow();
  });
  it("rejects every missing required envelope field and unknown fields", async () => {
    const root = await fixture();
    const entity = await read<Record<string, unknown>>(root, ENTITY_PATH);
    for (const field of Object.keys(entity)) {
      const candidate = { ...entity };
      delete candidate[field];
      expect(() => assertSchema("Entity", candidate, "entity")).toThrow();
    }
    expect(() => assertSchema("Entity", { ...entity, component: "Execute" }, "entity")).toThrow(
      "additional",
    );
  });
  it.each([
    (entity: Entity) => {
      entity.data.bodyPath = "../escape.md";
    },
    (entity: Entity) => {
      entity.timestamps.updatedAt = "2026-09-07T10:30:00";
    },
    (entity: Entity) => {
      entity.relationships[0]!.targetId = "absent";
    },
    (entity: Entity) => {
      entity.view.contextOverrides!.navigation = "full";
    },
    (entity: Entity) => {
      entity.view.permittedTypes = ["label"];
    },
    (entity: Entity) => {
      entity.publication.eligibility = "public";
    },
    (entity: Entity) => {
      entity.ownershipPolicyId = "self-authorized";
    },
  ])("fails schema/graph/policy-invalid entities", async (mutate) => {
    const root = await fixture();
    await editEntity(root, mutate);
    await expect(validateContent(root)).rejects.toThrow();
  });
  it("rejects duplicate descriptor formats", async () => {
    const root = await fixture();
    await write(root, ENTITY_PATH.replace(".yaml", ".json"), await read(root, ENTITY_PATH));
    await expect(validateContent(root)).rejects.toThrow("exactly one");
  });
  it("rejects a forbidden explicit default even when every render context overrides it", async () => {
    const root = await fixture();
    await editEntity(root, (entity) => {
      entity.view.defaultType = "full";
      entity.view.permittedTypes = ["label", "tile", "card"];
      entity.view.contextOverrides = {
        navigation: "label",
        collection: "card",
        relationship: "tile",
        search: "label",
        detail: "card",
      };
    });
    await expect(validateContent(root)).rejects.toThrow("/view/defaultType");
    await expect(compileContent(root, { target: "local", basePath: "/" })).rejects.toThrow(
      "explicit default full",
    );
  });
  it("rejects escaping symlinks and oversized files", async () => {
    const root = await fixture();
    await symlink(
      join(root, "references/taxonomy.yaml"),
      join(root, "content/entities/tracker-overview/escape.md"),
    );
    await editEntity(root, (entity) => {
      entity.data.bodyPath = "escape.md";
    });

    await expect(validateContent(root)).rejects.toThrow("symlinks");
    await editEntity(root, (entity) => {
      entity.data.bodyPath = "body.md";
    });
    await writeFile(join(root, BODY_PATH), "x".repeat(262_145));
    await expect(validateContent(root)).rejects.toThrow();
  });
  it("rejects taxonomy cycles and duplicate sibling slugs", async () => {
    const root = await fixture();
    const taxonomy = await read<Taxonomy>(root, "references/taxonomy.yaml");
    taxonomy.nodes[0]!.parentId = taxonomy.nodes[1]!.id;
    await write(root, "references/taxonomy.yaml", taxonomy);
    await expect(validateContent(root)).rejects.toThrow("cycle");
    delete taxonomy.nodes[0]!.parentId;
    delete taxonomy.nodes[1]!.parentId;
    taxonomy.nodes[1]!.slug = taxonomy.nodes[0]!.slug;
    await write(root, "references/taxonomy.yaml", taxonomy);
    await expect(validateContent(root)).rejects.toThrow("duplicate");
  });
  it("rejects missing/modified/nested ownership markers", async () => {
    const root = await fixture();
    const body = await readFile(join(root, BODY_PATH), "utf8");
    await writeFile(
      join(root, BODY_PATH),
      body.replace("BEGIN AGENT-MANAGED:", "BEGIN  AGENT-MANAGED:"),
    );
    await expect(validateContent(root)).rejects.toThrow("marker");
  });
  it("rejects source and claim defects", async () => {
    const root = await fixture();
    await editEntity(root, (entity) =>
      entity.provenance.claims.push({
        id: "unsupported-claim",
        basis: "observed",
        statement: "Unsupported synthetic claim",
        sourceIds: ["missing-source"],
      }),
    );
    await expect(validateContent(root)).rejects.toThrow("unknown source");
  });
  it("rejects impossible failure/success and contradiction states", async () => {
    const root = await fixture();
    await editState(root, (state) => {
      state.lastAttemptAt = "2026-09-08T10:30:00-07:00";
      state.lastAttemptOutcome = "failed";
      state.lastSuccessfulRetrievalAt = state.lastAttemptAt;
      state.lastVerifiedAt = state.lastAttemptAt;
    });
    await expect(validateContent(root)).rejects.toThrow("failed or partial");
  });
});

async function localEvidence(root: string, locator: string, fingerprint: string) {
  const verifiedAt = "2026-09-08T10:30:00-07:00";
  await write(root, `research/topics/${ENTITY_ID}/sources.yaml`, {
    schemaVersion: 1,
    entityId: ENTITY_ID,
    sources: [
      {
        id: "local-evidence",
        title: "Synthetic local evidence",
        publisher: "Fixture owner",
        sourceType: "owner-material",
        locator,
        access: "private",
        retrievedAt: verifiedAt,
        fingerprint,
      },
    ],
  });
  const state = await read<ResearchState>(root, STATE_PATH);
  state.lastAttemptAt = verifiedAt;
  state.lastAttemptOutcome = "succeeded";
  state.lastSuccessfulRetrievalAt = verifiedAt;
  state.lastVerifiedAt = verifiedAt;
  await write(root, STATE_PATH, state);
  const run: RunOutcome = {
    schemaVersion: 1,
    runId: "synthetic-local-evidence",
    workflow: "research-topic",
    baseRevision: "a".repeat(40),
    requestKey: "b".repeat(64),
    scopeIds: [ENTITY_ID],
    sourceEvidence: [{ sourceId: "local-evidence", retrievedAt: verifiedAt, fingerprint }],
    changedEntityIds: [],
    validation: "Synthetic fixture only.",
    startedAt: verifiedAt,
    endedAt: verifiedAt,
    outcome: "succeeded",
    reviewItems: [],
    continuation: "Real supervision remains pending.",
  };
  await write(root, `research/topics/${ENTITY_ID}/runs/${run.runId}.yaml`, run);
}

describe("research source locator confinement", () => {
  it("rejects a nonexistent locator even with a matching fingerprint/run/verified timestamp", async () => {
    const root = await fixture();
    await localEvidence(root, "research/topics/tracker-overview/missing.md", "a".repeat(64));
    await expect(validateContent(root)).rejects.toThrow("ENOENT");
  });
  it.each(["../outside.md", "/outside.md", "research/topics/../outside.md", "C:/outside.md"])(
    "rejects unsafe source locator %s",
    async (locator) => {
      const root = await fixture();
      await localEvidence(root, locator, "a".repeat(64));
      await expect(validateContent(root)).rejects.toThrow();
    },
  );
  it("rejects symlink locators", async () => {
    const root = await fixture();
    const locator = `research/topics/${ENTITY_ID}/linked.md`;
    await symlink(join(root, BODY_PATH), join(root, locator));
    await localEvidence(root, locator, "a".repeat(64));
    await expect(validateContent(root)).rejects.toThrow("symlinks");
  });
  it.each(["directory", "oversized"] as const)("rejects a %s source locator", async (kind) => {
    const root = await fixture();
    const locator =
      kind === "directory"
        ? `research/topics/${ENTITY_ID}`
        : `research/topics/${ENTITY_ID}/oversized.md`;
    if (kind === "oversized") await writeFile(join(root, locator), "x".repeat(262_145));
    await localEvidence(root, locator, "a".repeat(64));
    await expect(validateContent(root)).rejects.toThrow("regular file at most 256 KiB");
  });
  it("accepts existing confined bounded local evidence", async () => {
    const root = await fixture();
    const locator = `research/topics/${ENTITY_ID}/evidence.md`;
    await localEvidence(root, locator, hashBytes(await readFile(join(root, locator))));
    await expect(validateContent(root)).resolves.toBeUndefined();
  });
});
