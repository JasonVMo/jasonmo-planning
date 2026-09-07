import { afterEach, describe, expect, it } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  Entity,
  PublicationApproval,
  PublicationPolicy,
  ResearchState,
  Taxonomy,
} from "@planning/entity-model";
import { stringify } from "yaml";
import { compileContent } from "../src/index.ts";
import { serializeCanonical } from "../src/canonical.ts";
import { approvalDigests, projectCorpus } from "../src/project.ts";
import { loadCorpus } from "../src/validate.ts";
import { reconcileContent } from "../src/reconcile.ts";
import { assertSchema } from "../src/schema.ts";
import {
  cleanup,
  CANARY,
  editEntity,
  editState,
  ENTITY_PATH,
  fixture,
  proposal,
  read,
  STATE_PATH,
  write,
} from "./fixtures.ts";

afterEach(cleanup);
async function publicFixture() {
  const root = await fixture();
  await editEntity(root, (entity) => {
    entity.sensitivity.classification = "public";
    entity.publication = { eligibility: "public", requestedTargets: ["public", "private-group"] };
  });
  const hiddenPath = "content/entities/tracker-data-view-architecture/entity.yaml";
  const hidden = await read<Entity>(root, hiddenPath);
  hidden.title = CANARY;
  await write(root, hiddenPath, hidden);
  const taxonomy = await read<Taxonomy>(root, "references/taxonomy.yaml");
  for (const node of taxonomy.nodes) {
    node.sensitivity.classification = "public";
    node.publication = { eligibility: "public", requestedTargets: ["public", "private-group"] };
  }
  taxonomy.nodes.push({
    id: "private-canary-topic",
    title: CANARY,
    description: CANARY,
    slug: "canary",
    order: 30,
    sensitivity: { classification: "private", containsPersonalData: false },
    publication: { eligibility: "local", requestedTargets: [] },
  });
  await write(root, "references/taxonomy.yaml", taxonomy);
  const policy = await read<PublicationPolicy>(root, "references/publication/policy.yaml");
  policy.reviewers = ["synthetic-owner"];
  policy.destinations = [
    { id: "synthetic-public", audience: "public" },
    { id: "synthetic-group", audience: "private-group" },
  ];
  await write(root, "references/publication/policy.yaml", policy);
  return root;
}
async function approve(root: string, target: "public" | "private-group", basePath = "/") {
  const projection = projectCorpus(await loadCorpus(root), { target, basePath }, false);
  await write(root, `references/publication/approvals/${target}.yaml`, {
    schemaVersion: 1,
    target,
    deploymentId: target === "public" ? "synthetic-public" : "synthetic-group",
    ...approvalDigests(projection),
    policyVersion: 1,
    reviewer: "synthetic-owner",
    approvedAt: "2026-09-08T10:30:00-07:00",
  });
  return projection;
}
describe("deterministic audience-safe compiler", () => {
  it("compiles twice without touching canonical bytes or adding build time", async () => {
    const root = await fixture();
    const before = await readFile(join(root, ENTITY_PATH));
    const first = await compileContent(root, { target: "local", basePath: "/tracker" });
    const second = await compileContent(root, { target: "local", basePath: "/tracker/" });
    expect(serializeCanonical(first)).toBe(serializeCanonical(second));
    expect(first.entities).toHaveLength(2);
    expect(first.deployable).toBe(false);
    expect(first.entities[0]!.viewModels.full?.body).not.toContain("AGENT-MANAGED");
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(before);
    expect(serializeCanonical(first)).not.toMatch(
      /ownershipPolicy|sourceCursors|nextAction|bodyPath|buildTime/,
    );
  });
  it("requires exact approvals and removes private canaries from every browser/search field", async () => {
    const root = await publicFixture();
    await expect(compileContent(root, { target: "public", basePath: "/" })).rejects.toThrow(
      "exact",
    );
    const approved = await approve(root, "public");
    expect(await compileContent(root, { target: "public", basePath: "/" })).toEqual(approved);
    const serialized = serializeCanonical(approved);
    expect(serialized).not.toContain(CANARY);
    expect(serialized).not.toContain("tracker-data-view-architecture");
    expect(serialized).not.toContain("private-canary-topic");
    expect(approved.entities[0]!.relationships).toHaveLength(0);
    expect(approved.deployable).toBe(false);
    await approve(root, "private-group");
    expect(
      serializeCanonical(await compileContent(root, { target: "private-group", basePath: "/" })),
    ).not.toContain(CANARY);
  });
  it("invalidates approval on projected bytes/base path/policy but not hidden retry state", async () => {
    const root = await publicFixture();
    const approved = await approve(root, "public");
    await editState(root, (state) => {
      state.nextAction = "PRIVATE OPERATIONAL CANARY";
    });
    expect((await compileContent(root, { target: "public", basePath: "/" })).contentDigest).toBe(
      approved.contentDigest,
    );
    await expect(compileContent(root, { target: "public", basePath: "/tracker/" })).rejects.toThrow(
      "exact",
    );
    await editEntity(root, (entity) => {
      entity.summary += " Changed projected text.";
    });
    await expect(compileContent(root, { target: "public", basePath: "/" })).rejects.toThrow(
      "exact",
    );
  });
  it("reconciles private state while preserving approvals at their own normalized base paths", async () => {
    const root = await publicFixture();
    const publicProjection = await approve(root, "public", "/tracker/");
    const groupProjection = await approve(root, "private-group", "/group/");
    const publicRecord = await read<PublicationApproval>(
      root,
      "references/publication/approvals/public.yaml",
    );
    expect(publicRecord.basePath).toBe("/tracker/");
    expect(() =>
      assertSchema("PublicationApproval", { ...publicRecord, basePath: "/tracker" }, "approval"),
    ).toThrow();
    expect(() =>
      assertSchema("PublicationApproval", { ...publicRecord, basePath: "/tracker/\n" }, "approval"),
    ).toThrow();
    const state = await read<ResearchState>(root, STATE_PATH);
    state.nextAction = "Private continuation changed without changing browser content.";
    const path = await proposal(root, { [STATE_PATH]: stringify(state) });
    expect((await reconcileContent(root, path)).status).toBe("validated");
    expect((await reconcileContent(root, path, { apply: true })).status).toBe("applied");
    expect(await compileContent(root, { target: "public", basePath: "/tracker/" })).toEqual(
      publicProjection,
    );
    expect(await compileContent(root, { target: "private-group", basePath: "/group/" })).toEqual(
      groupProjection,
    );
    await expect(compileContent(root, { target: "public", basePath: "/" })).rejects.toThrow(
      "exact",
    );
  });
  it("still rejects projected-content edits and misdeclared approval base paths", async () => {
    const root = await publicFixture();
    await approve(root, "public", "/tracker/");
    const before = await readFile(join(root, ENTITY_PATH));
    const entity = await read<Entity>(root, ENTITY_PATH);
    entity.summary = "Changed projected summary.";
    entity.timestamps.updatedAt = "2026-09-08T10:30:00-07:00";
    const path = await proposal(root, { [ENTITY_PATH]: stringify(entity) });
    await expect(reconcileContent(root, path, { apply: true })).rejects.toThrow("exact");
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(before);
    const approval = await read<PublicationApproval>(
      root,
      "references/publication/approvals/public.yaml",
    );
    approval.basePath = "/";
    await write(root, "references/publication/approvals/public.yaml", approval);
    await expect(compileContent(root, { target: "public", basePath: "/tracker/" })).rejects.toThrow(
      "exact",
    );
  });
  it("requires visible taxonomy ancestry and primary-topic closure", async () => {
    const root = await publicFixture();
    const taxonomy = await read<Taxonomy>(root, "references/taxonomy.yaml");
    taxonomy.nodes[0]!.publication = { eligibility: "local", requestedTargets: [] };
    await write(root, "references/taxonomy.yaml", taxonomy);
    await expect(compileContent(root, { target: "public", basePath: "/" })).rejects.toThrow(
      "ancestor",
    );
  });
  it("rejects unsafe bases and validates omitted private entities before projection", async () => {
    const root = await publicFixture();
    await expect(
      compileContent(root, { target: "local", basePath: "/../escape/" }),
    ).rejects.toThrow("base path");
    await writeFile(
      join(root, "content/entities/tracker-data-view-architecture/body.md"),
      "<script>bad</script>",
    );
    await expect(compileContent(root, { target: "public", basePath: "/" })).rejects.toThrow();
  });
});
