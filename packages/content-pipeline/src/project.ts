import type {
  Audience,
  Entity,
  PublicationApproval,
  ResolvedContexts,
  SiteEntity,
  SiteManifest,
  TopicView,
  ViewModels,
  ViewType,
} from "@planning/entity-model";
import { AUDIENCES, RENDER_CONTEXTS, VIEW_TYPES } from "@planning/entity-model";
import { digest } from "./canonical.ts";
import { fail } from "./diagnostics.ts";
import { projectMarkdown, safeUrl } from "./markdown.ts";
import { assertSchema } from "./schema.ts";
import { searchDocuments } from "./search-documents.ts";
import { loadCorpus, type Corpus } from "./validate.ts";
import { adaptView, type Presentation } from "./view-adapters.ts";
import { resolveView } from "./view-selection.ts";

export function normalizeBasePath(path: string): string {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*$/.test(path))
    throw new Error("Invalid base path; use / or /tracker/");
  return path.endsWith("/") ? path : `${path}/`;
}

export function eligible(
  item: Pick<Entity, "sensitivity" | "publication">,
  target: Audience,
): boolean {
  if (target === "local") return true;
  if (item.sensitivity.classification === "restricted") return false;
  const rank = { local: 0, "private-owner": 1, "private-group": 2, public: 3 };
  if (rank[item.publication.eligibility] < rank[target]) return false;
  if (
    target === "public" &&
    (item.sensitivity.classification !== "public" || item.sensitivity.containsPersonalData)
  )
    return false;
  return target === "private-owner" || item.publication.requestedTargets.includes(target);
}

export function approvalDigests(
  manifest: SiteManifest,
): Pick<
  PublicationApproval,
  | "basePath"
  | "contentDigest"
  | "taxonomyDigest"
  | "citationsDigest"
  | "assetsDigest"
  | "closureDigest"
  | "entityIds"
> {
  return {
    basePath: manifest.basePath,
    contentDigest: manifest.contentDigest,
    taxonomyDigest: digest(manifest.taxonomy),
    citationsDigest: digest(
      manifest.entities.map((entity) => ({ id: entity.id, citations: entity.citations })),
    ),
    assetsDigest: digest([]),
    closureDigest: digest(
      manifest.entities.map((entity) => ({ id: entity.id, relationships: entity.relationships })),
    ),
    entityIds: manifest.entities.map((entity) => entity.id),
  };
}

export function requireApproval(corpus: Corpus, manifest: SiteManifest): void {
  if (manifest.audience !== "public" && manifest.audience !== "private-group") return;
  const expected = approvalDigests(manifest);
  const matches = corpus.approvals.filter(
    (approval) =>
      approval.target === manifest.audience &&
      approval.basePath === manifest.basePath &&
      !approval.expiresAt &&
      approval.policyVersion === corpus.publication.policyVersion &&
      digest({
        basePath: approval.basePath,
        contentDigest: approval.contentDigest,
        taxonomyDigest: approval.taxonomyDigest,
        citationsDigest: approval.citationsDigest,
        assetsDigest: approval.assetsDigest,
        closureDigest: approval.closureDigest,
        entityIds: [...approval.entityIds].sort(),
      }) === digest(expected),
  );
  if (matches.length !== 1)
    fail(
      "references/publication/approvals",
      "/contentDigest",
      `exactly one non-expiring exact-projection approval required for ${manifest.audience}; candidate digest ${manifest.contentDigest}`,
    );
}

export function projectCorpus(
  corpus: Corpus,
  options: { target: Audience; basePath: string },
  checkApproval = true,
): SiteManifest {
  const { target } = options;
  if (!AUDIENCES.includes(target)) throw new Error("Unknown audience");
  const basePath = normalizeBasePath(options.basePath);
  const visibleTopics = corpus.taxonomy.nodes.filter((node) => eligible(node, target));
  const topicIds = new Set(visibleTopics.map((node) => node.id));
  for (const node of visibleTopics)
    if (node.parentId && !topicIds.has(node.parentId))
      fail(node.id, "/parentId", "visible taxonomy requires audience-visible ancestor closure");
  const selected = corpus.entities.filter((item) => eligible(item.entity, target));
  const byId = new Map(selected.map((item) => [item.entity.id, item]));
  const entityIds = new Set(byId.keys());
  for (const item of selected)
    if (!topicIds.has(item.entity.taxonomy.primaryTopicId))
      fail(item.entity.id, "/taxonomy", "selected entity primary topic is hidden for audience");
  const usedTopics = new Set<string>();
  for (const item of selected) {
    for (const topic of [
      item.entity.taxonomy.primaryTopicId,
      ...item.entity.taxonomy.relatedTopicIds.filter((id) => topicIds.has(id)),
    ]) {
      let id: string | undefined = topic;
      while (id) {
        usedTopics.add(id);
        id = visibleTopics.find((node) => node.id === id)?.parentId;
      }
    }
  }
  const taxonomy: TopicView[] = visibleTopics
    .filter((node) => usedTopics.has(node.id))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "en"))
    .map((node) => {
      const result: TopicView = {
        id: node.id,
        title: node.title,
        description: node.description,
        order: node.order,
      };
      if (node.parentId) result.parentId = node.parentId;
      return result;
    });
  const allowExternal = (url: string): boolean => {
    if (!safeUrl(url)) return false;
    if (target === "local" || target === "private-owner") return true;
    const parsed = new URL(url);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      corpus.publication.publicSourceHosts.includes(parsed.hostname)
    );
  };
  const reachable = new Map<string, Set<ViewType>>();
  const contexts = new Map<string, ResolvedContexts>();
  for (const item of selected) {
    const resolved = Object.fromEntries(
      RENDER_CONTEXTS.map((context) => [context, resolveView(item.entity, context)]),
    ) as unknown as ResolvedContexts;
    contexts.set(item.entity.id, resolved);
    reachable.set(item.entity.id, new Set(Object.values(resolved)));
    if (item.entity.view.defaultType)
      reachable.get(item.entity.id)!.add(item.entity.view.defaultType);
    // Calendar is an additional presentation, not permission to expose an unselected body.
    if (item.entity.dataType === "event" && item.entity.view.permittedTypes.includes("event"))
      reachable.get(item.entity.id)!.add("event");
  }
  for (const item of selected)
    for (const edge of item.entity.relationships) {
      const targetEntity = byId.get(edge.targetId)?.entity;
      if (targetEntity)
        reachable.get(edge.targetId)!.add(resolveView(targetEntity, "relationship", edge.viewType));
    }
  const text = new Map<string, string>();
  const entities: SiteEntity[] = selected
    .map(({ entity, body, bodyPath, state }) => {
      const route = `#/entities/${entity.id}`;
      const safe = projectMarkdown(body, bodyPath, {
        entityIds,
        topicIds: new Set(taxonomy.map((node) => node.id)),
        allowExternal,
      });
      text.set(entity.id, safe.text);
      const viewModels: ViewModels = {};
      const presentation: Presentation = {
        title: entity.title,
        summary: entity.summary,
        href: route,
        body: safe.markdown,
        badges: [...entity.taxonomy.tags].sort(),
      };
      if (entity.dataType === "event" && "schedule" in entity.data) {
        presentation.event = {
          kind: entity.data.kind,
          status: entity.data.status,
          schedule: entity.data.schedule,
        };
        if (entity.data.location !== undefined) presentation.event.location = entity.data.location;
      }
      for (const view of VIEW_TYPES.filter((type) => reachable.get(entity.id)!.has(type))) {
        // Keep the key/model correspondence concrete for TypeScript and schema validation.
        switch (view) {
          case "label":
            viewModels.label = adaptView(entity.dataType, "label", presentation);
            break;
          case "tile":
            viewModels.tile = adaptView(entity.dataType, "tile", presentation);
            break;
          case "card":
            viewModels.card = adaptView(entity.dataType, "card", presentation);
            break;
          case "full":
            viewModels.full = adaptView(entity.dataType, "full", presentation);
            break;
          case "event":
            viewModels.event = adaptView(entity.dataType, "event", presentation);
            break;
          case "calendar-month":
            viewModels["calendar-month"] = adaptView(
              entity.dataType,
              "calendar-month",
              presentation,
            );
            break;
          case "calendar-day":
            viewModels["calendar-day"] = adaptView(entity.dataType, "calendar-day", presentation);
            break;
          case "timeline":
            viewModels.timeline = adaptView(entity.dataType, "timeline", presentation);
            break;
        }
      }
      const result: SiteEntity = {
        id: entity.id,
        dataType: entity.dataType,
        dataVersion: entity.dataVersion,
        title: entity.title,
        summary: entity.summary,
        route,
        primaryTopicId: entity.taxonomy.primaryTopicId,
        tags: [...entity.taxonomy.tags].sort(),
        relationships: entity.relationships
          .filter((edge) => byId.has(edge.targetId))
          .map((edge) => ({
            kind: edge.kind,
            targetId: edge.targetId,
            viewType: resolveView(byId.get(edge.targetId)!.entity, "relationship", edge.viewType),
          }))
          .sort((a, b) => `${a.kind}:${a.targetId}`.localeCompare(`${b.kind}:${b.targetId}`, "en")),
        citations: entity.provenance.sources
          .filter(
            (source) =>
              source.url &&
              source.access !== "restricted" &&
              (target === "local" || target === "private-owner" || source.access === "public") &&
              allowExternal(source.url),
          )
          .map((source) => ({ title: source.title, url: source.url! }))
          .sort((a, b) => `${a.url}:${a.title}`.localeCompare(`${b.url}:${b.title}`, "en")),
        view: {
          defaultType: entity.view.defaultType ?? contexts.get(entity.id)!.detail,
          byContext: contexts.get(entity.id)!,
        },
        viewModels,
      };
      if (state.lastVerifiedAt) result.lastVerifiedAt = state.lastVerifiedAt;
      return result;
    })
    .sort((a, b) => a.id.localeCompare(b.id, "en"));
  const normalized = {
    schemaVersion: 1 as const,
    audience: target,
    basePath,
    deployable: false,
    taxonomy,
    entities,
    searchDocuments: searchDocuments(entities, taxonomy, text),
  };
  const manifest: SiteManifest = {
    ...normalized,
    contentDigest: digest({
      policyVersion: corpus.publication.policyVersion,
      policy: corpus.publication,
      projection: normalized,
    }),
  };
  assertSchema<SiteManifest>("SiteManifest", manifest, "<browser-projection>");
  if (checkApproval) requireApproval(corpus, manifest);
  return manifest;
}

export async function compileContent(
  root: string,
  options: { target: Audience; basePath: string },
): Promise<SiteManifest> {
  return projectCorpus(await loadCorpus(root), options);
}
