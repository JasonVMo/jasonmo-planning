import type { SearchDocument, SiteEntity, TopicView } from "@planning/entity-model";

export function searchDocuments(
  entities: readonly SiteEntity[],
  taxonomy: readonly TopicView[],
  text: ReadonlyMap<string, string>,
): SearchDocument[] {
  const topics = new Map(taxonomy.map((topic) => [topic.id, topic.title]));
  const titles = new Map(entities.map((entity) => [entity.id, entity.title]));
  return entities.map((entity) => ({
    id: entity.id,
    title: entity.title,
    summary: entity.summary,
    body: [
      text.get(entity.id) ?? "",
      topics.get(entity.primaryTopicId) ?? "",
      entity.dataType,
      ...entity.relationships.map((edge) => titles.get(edge.targetId) ?? ""),
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20_000),
    tags: [...entity.tags],
    primaryTopicId: entity.primaryTopicId,
    route: entity.route,
  }));
}
