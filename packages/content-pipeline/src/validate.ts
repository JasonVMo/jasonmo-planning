import type {
  Entity,
  OwnershipPolicy,
  PublicationApproval,
  PublicationPolicy,
  ResearchState,
  RunOutcome,
  SourcesManifest,
  Taxonomy,
} from "@planning/entity-model";
import { RENDER_CONTEXTS } from "@planning/entity-model";
import { RepositoryReader, safeRelative, type Overlay } from "./load.ts";
import { assertSchema } from "./schema.ts";
import { fail } from "./diagnostics.ts";
import { managedRegions } from "./ownership.ts";
import { projectMarkdown, safeUrl } from "./markdown.ts";
import { resolveView, validateDefaultView } from "./view-selection.ts";
import { DATA_TYPES, supportedViews } from "./view-adapters.ts";
import { beginSnapshot, finishSnapshot } from "./transaction.ts";

export interface LoadedEntity {
  entity: Entity;
  descriptorPath: string;
  bodyPath: string;
  body: string;
  state: ResearchState;
  sources: SourcesManifest;
  runs: RunOutcome[];
}
export interface Corpus {
  entities: LoadedEntity[];
  taxonomy: Taxonomy;
  ownership: OwnershipPolicy;
  publication: PublicationPolicy;
  approvals: PublicationApproval[];
}
const rank = { local: 0, "private-owner": 1, "private-group": 2, public: 3 } as const;

function unique(values: readonly string[], file: string, field: string): void {
  if (new Set(values).size !== values.length) fail(file, field, "duplicate stable ID or key");
}
function before(
  left: string | undefined,
  right: string | undefined,
  file: string,
  field: string,
): void {
  if (left && right && Date.parse(left) > Date.parse(right))
    fail(file, field, "timestamps are out of order");
}
function publicationValid(
  item: { sensitivity: Entity["sensitivity"]; publication: Entity["publication"] },
  file: string,
): void {
  const { sensitivity, publication } = item;
  if (sensitivity.classification === "restricted" && publication.eligibility !== "local")
    fail(file, "/publication", "restricted material is local-only");
  if (
    (sensitivity.classification !== "public" || sensitivity.containsPersonalData) &&
    publication.eligibility === "public"
  )
    fail(file, "/publication", "public eligibility requires public non-personal content");
  if (publication.requestedTargets.some((target) => rank[target] > rank[publication.eligibility]))
    fail(file, "/publication", "requested audience exceeds eligibility");
}
function plain(text: string, file: string, field: string): void {
  if (
    /[<>]/.test(text) ||
    [...text].some((char) => char.charCodeAt(0) < 32 && !"\r\n\t".includes(char))
  )
    fail(file, field, "expected plain text without HTML/control characters");
}
async function validateSources(
  sources: SourcesManifest["sources"],
  file: string,
  reader: RepositoryReader,
): Promise<void> {
  unique(
    sources.map((source) => source.id),
    file,
    "/sources/id",
  );
  unique(
    sources
      .filter((source) => source.url)
      .map((source) => {
        const url = new URL(source.url!);
        url.hash = "";
        return url.href;
      }),
    file,
    "/sources/url",
  );
  for (const source of sources) {
    plain(source.title, file, "/sources/title");
    plain(source.publisher, file, "/sources/publisher");
    if (source.url && !safeUrl(source.url)) fail(file, "/sources/url", "unsafe source URL");
    if (source.locator) await reader.bytes(safeRelative(source.locator));
  }
}
export function validateState(state: ResearchState, file: string): void {
  before(state.lastSuccessfulRetrievalAt, state.lastAttemptAt, file, "/lastSuccessfulRetrievalAt");
  before(state.lastVerifiedAt, state.lastAttemptAt, file, "/lastVerifiedAt");
  before(state.lastSuccessfulRetrievalAt, state.lastVerifiedAt, file, "/lastVerifiedAt");
  before(state.lastReviewedAt, state.nextHumanReviewAt, file, "/nextHumanReviewAt");
  if (
    state.lastAttemptOutcome &&
    ["failed", "blocked", "partial"].includes(state.lastAttemptOutcome) &&
    state.lastVerifiedAt &&
    Date.parse(state.lastVerifiedAt) >= Date.parse(state.lastAttemptAt!)
  )
    fail(file, "/lastVerifiedAt", "failed or partial attempts cannot be successful verification");
  if (state.contradictions.length && state.status !== "blocked")
    fail(file, "/status", "contradictory evidence requires blocked status and human review");
}

export async function loadCorpus(
  root: string,
  overlay?: Overlay,
  internalWriter = false,
): Promise<Corpus> {
  const reader = new RepositoryReader(root, overlay);
  const coordination = new RepositoryReader(root);
  const generation = await beginSnapshot(coordination, internalWriter);
  const taxonomyValue = await reader.document("references/taxonomy.yaml");
  assertSchema<Taxonomy>("Taxonomy", taxonomyValue, "references/taxonomy.yaml");
  const taxonomy = taxonomyValue;
  const ownershipValue = await reader.document("references/ownership/policies.yaml");
  assertSchema<OwnershipPolicy>(
    "OwnershipPolicy",
    ownershipValue,
    "references/ownership/policies.yaml",
  );
  const ownership = ownershipValue;
  const publicationValue = await reader.document("references/publication/policy.yaml");
  assertSchema<PublicationPolicy>(
    "PublicationPolicy",
    publicationValue,
    "references/publication/policy.yaml",
  );
  const publication = publicationValue;
  unique(
    ownership.policies.map((policy) => policy.id),
    "references/ownership/policies.yaml",
    "/policies",
  );
  unique(
    publication.destinations.map((destination) => destination.id),
    "references/publication/policy.yaml",
    "/destinations",
  );
  unique(
    taxonomy.nodes.map((node) => node.id),
    "references/taxonomy.yaml",
    "/nodes",
  );
  unique(
    taxonomy.nodes.map((node) => `${node.parentId ?? ""}/${node.slug}`),
    "references/taxonomy.yaml",
    "/nodes/slug",
  );
  const topics = new Map(taxonomy.nodes.map((node) => [node.id, node]));
  const retiredIds = taxonomy.nodes.flatMap((node) => node.retiredIds ?? []);
  unique([...topics.keys(), ...retiredIds], "references/taxonomy.yaml", "/retiredIds");
  unique(
    taxonomy.nodes.flatMap((node) =>
      [node.slug, ...(node.retiredSlugs ?? [])].map((slug) => `${node.parentId ?? ""}/${slug}`),
    ),
    "references/taxonomy.yaml",
    "/retiredSlugs",
  );
  for (const node of taxonomy.nodes) {
    publicationValid(node, node.id);
    plain(node.title, node.id, "/title");
    plain(node.description, node.id, "/description");
    const seen = new Set<string>([node.id]);
    let parent = node.parentId;
    while (parent) {
      if (!topics.has(parent)) fail(node.id, "/parentId", "missing taxonomy parent");
      if (seen.has(parent)) fail(node.id, "/parentId", "taxonomy cycle");
      seen.add(parent);
      parent = topics.get(parent)!.parentId;
    }
  }
  const approvals: PublicationApproval[] = [];
  for (const name of await reader.files("references/publication/approvals")) {
    if (!/\.(?:json|ya?ml)$/.test(name))
      fail(name, "", "approval directory only permits JSON/YAML records");
    const file = `references/publication/approvals/${name}`;
    const value = await reader.document(file);
    assertSchema<PublicationApproval>("PublicationApproval", value, file);
    if (!publication.reviewers.includes(value.reviewer))
      fail(file, "/reviewer", "reviewer is not owner-authorized");
    if (
      !publication.destinations.some(
        (destination) =>
          destination.id === value.deploymentId && destination.audience === value.target,
      )
    )
      fail(file, "/deploymentId", "destination is not owner-authorized");
    if (value.policyVersion !== publication.policyVersion)
      fail(file, "/policyVersion", "approval policy version is stale");
    before(value.approvedAt, value.expiresAt, file, "/expiresAt");
    approvals.push(value);
  }
  const entities: LoadedEntity[] = [];
  for (const id of await reader.files("content/entities")) {
    const directory = `content/entities/${id}`;
    const names = await reader.files(directory);
    const descriptors = names.filter((name) => /^entity\.(?:ya?ml|json)$/.test(name));
    if (descriptors.length !== 1)
      fail(directory, "", "exactly one entity.yaml/entity.yml/entity.json required");
    const descriptorPath = `${directory}/${descriptors[0]!}`;
    const value = await reader.document(descriptorPath);
    assertSchema<Entity>("Entity", value, descriptorPath);
    const entity = value;
    if (entity.id !== id) fail(descriptorPath, "/id", "entity ID must match storage directory");
    if (topics.has(id) || retiredIds.includes(id))
      fail(descriptorPath, "/id", "stable IDs are global and cannot reuse taxonomy or retired IDs");
    if (DATA_TYPES.get(entity.dataType)?.version !== entity.dataVersion)
      fail(descriptorPath, "/dataVersion", "unregistered data type/version");
    publicationValid(entity, descriptorPath);
    plain(entity.title, descriptorPath, "/title");
    plain(entity.summary, descriptorPath, "/summary");
    before(entity.timestamps.createdAt, entity.timestamps.updatedAt, descriptorPath, "/timestamps");
    before(entity.review.lastReviewedAt, entity.review.nextReviewAt, descriptorPath, "/review");
    for (const topic of [entity.taxonomy.primaryTopicId, ...entity.taxonomy.relatedTopicIds])
      if (!topics.has(topic)) fail(descriptorPath, "/taxonomy", `unknown topic ${topic}`);
    if (entity.taxonomy.relatedTopicIds.includes(entity.taxonomy.primaryTopicId))
      fail(descriptorPath, "/taxonomy", "primary topic duplicated as related topic");
    validateDefaultView(entity, descriptorPath);
    for (const context of RENDER_CONTEXTS) resolveView(entity, context);
    if (entity.view.permittedTypes.some((view) => !supportedViews(entity.dataType).includes(view)))
      fail(descriptorPath, "/view/permittedTypes", "permitted view lacks registered adapter");
    const policy = ownership.policies.find((item) => item.id === entity.ownershipPolicyId);
    if (!policy) fail(descriptorPath, "/ownershipPolicyId", "unknown central ownership policy");
    const bodyRelative = safeRelative(entity.data.bodyPath);
    if (!bodyRelative.endsWith(".md"))
      fail(descriptorPath, "/data/bodyPath", "Markdown body must use .md extension");
    const bodyPath = `${directory}/${bodyRelative}`;
    const body = await reader.text(bodyPath);
    managedRegions(body, policy, bodyPath);
    projectMarkdown(body, bodyPath);
    await validateSources(entity.provenance.sources, descriptorPath, reader);
    unique(
      entity.provenance.claims.map((claim) => claim.id),
      descriptorPath,
      "/provenance/claims",
    );
    for (const source of entity.provenance.sources) {
      before(
        source.retrievedAt,
        entity.timestamps.updatedAt,
        descriptorPath,
        "/provenance/sources/retrievedAt",
      );
    }
    for (const claim of entity.provenance.claims)
      for (const sourceId of claim.sourceIds)
        if (!entity.provenance.sources.some((source) => source.id === sourceId))
          fail(descriptorPath, "/provenance/claims/sourceIds", `unknown source ${sourceId}`);
    if (entity.capturePolicy === "link-only" && entity.provenance.claims.length)
      fail(descriptorPath, "/capturePolicy", "link-only sources cannot carry copied claims");
    if (entity.refresh.stateId !== entity.id)
      fail(descriptorPath, "/refresh/stateId", "research state ID must match entity ID");
    const statePath = `research/topics/${id}/state.yaml`;
    const stateValue = await reader.document(statePath);
    assertSchema<ResearchState>("ResearchState", stateValue, statePath);
    if (stateValue.entityId !== id) fail(statePath, "/entityId", "research state/entity mismatch");
    validateState(stateValue, statePath);
    const sourcesPath = `research/topics/${id}/sources.yaml`;
    const sources = await reader.document(sourcesPath);
    assertSchema<SourcesManifest>("SourcesManifest", sources, sourcesPath);
    if (sources.entityId !== id) fail(sourcesPath, "/entityId", "source manifest/entity mismatch");
    await validateSources(sources.sources, sourcesPath, reader);
    await reader.text(`research/topics/${id}/evidence.md`);
    for (const cursor of stateValue.sourceCursors)
      if (!sources.sources.some((source) => source.id === cursor.sourceId))
        fail(statePath, "/sourceCursors", "cursor references missing source");
    const runs: RunOutcome[] = [];
    for (const name of await reader.files(`research/topics/${id}/runs`)) {
      const path = `research/topics/${id}/runs/${name}`;
      const run = await reader.document(path);
      assertSchema<RunOutcome>("RunOutcome", run, path);
      if (!run.scopeIds.includes(id) || name !== `${run.runId}.yaml`)
        fail(path, "/runId", "run path/scope mismatch");
      before(run.startedAt, run.endedAt, path, "/endedAt");
      if ((run.outcome === "failed" || run.outcome === "blocked") && run.changedEntityIds.length)
        fail(path, "/changedEntityIds", "failed runs cannot report promoted entity changes");
      for (const evidence of run.sourceEvidence) {
        if (!sources.sources.some((source) => source.id === evidence.sourceId))
          fail(path, "/sourceEvidence", "run evidence references missing source");
        before(evidence.retrievedAt, run.endedAt, path, "/sourceEvidence/retrievedAt");
      }
      runs.push(run);
    }
    unique(
      runs.map((run) => run.requestKey),
      statePath,
      "/runs/requestKey",
    );
    if (
      stateValue.lastVerifiedAt &&
      !runs.some(
        (run) =>
          run.endedAt === stateValue.lastVerifiedAt &&
          ["succeeded", "no-change"].includes(run.outcome) &&
          run.sourceEvidence.length &&
          run.sourceEvidence.every((evidence) =>
            sources.sources.some(
              (source) =>
                source.id === evidence.sourceId && source.fingerprint === evidence.fingerprint,
            ),
          ),
      )
    )
      fail(
        statePath,
        "/lastVerifiedAt",
        "verified state requires matching successful evidenced run and source fingerprints",
      );
    entities.push({ entity, descriptorPath, bodyPath, body, state: stateValue, sources, runs });
  }
  unique(
    entities.map((item) => item.entity.id),
    "content/entities",
    "/id",
  );
  const byId = new Map(entities.map((item) => [item.entity.id, item.entity]));
  for (const { entity, descriptorPath } of entities) {
    unique(
      entity.relationships.map((edge) => `${edge.kind}:${edge.targetId}`),
      descriptorPath,
      "/relationships",
    );
    for (const edge of entity.relationships) {
      const target = byId.get(edge.targetId);
      if (!target)
        fail(descriptorPath, "/relationships/targetId", `dangling target ${edge.targetId}`);
      resolveView(target, "relationship", edge.viewType);
    }
  }
  for (const id of await reader.files("research/topics"))
    if (!byId.has(id)) fail(`research/topics/${id}`, "", "orphan research state");
  await finishSnapshot(coordination, generation, internalWriter);
  return { entities, taxonomy, ownership, publication, approvals };
}

export async function validateContent(root: string): Promise<void> {
  await loadCorpus(root);
}
