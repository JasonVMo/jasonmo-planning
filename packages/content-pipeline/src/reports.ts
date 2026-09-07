import { assertSchema } from "./schema.ts";
import { loadCorpus, type Corpus } from "./validate.ts";

export function dueReport(corpus: Corpus, asOf: string) {
  assertSchema<string>("Timestamp", asOf, "--as-of");
  const now = Date.parse(asOf);
  return corpus.entities.map(({ entity, state }) => {
    const days = Number(entity.refresh.cadence.slice(1, -1));
    const verified = state.lastVerifiedAt ? Date.parse(state.lastVerifiedAt) : undefined;
    const age = verified === undefined ? undefined : (now - verified) / 86_400_000;
    if (age !== undefined && age < 0)
      throw new Error(`${entity.id}: --as-of predates last verification`);
    return {
      id: entity.id,
      freshness:
        age === undefined
          ? "unverified"
          : age >= 2 * days
            ? "stale"
            : age >= days
              ? "due"
              : "fresh",
      status: state.status,
      humanReviewDue: Date.parse(state.nextHumanReviewAt) <= now,
      retryEligible: !state.retryAfter || Date.parse(state.retryAfter) <= now,
      nextAction: state.nextAction,
    };
  });
}

export async function reports(root: string, asOf: string) {
  const corpus = await loadCorpus(root);
  const linked = new Set(
    corpus.entities.flatMap(({ entity }) =>
      entity.relationships.flatMap((edge) => [entity.id, edge.targetId]),
    ),
  );
  const titles = new Map<string, string[]>();
  for (const { entity } of corpus.entities) {
    const key = entity.title.toLowerCase().trim();
    titles.set(key, [...(titles.get(key) ?? []), entity.id]);
  }
  return {
    asOf,
    freshness: dueReport(corpus, asOf),
    orphans: corpus.entities
      .filter(({ entity }) => !linked.has(entity.id))
      .map(({ entity }) => entity.id),
    duplicateTitles: [...titles.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([title, ids]) => ({ title, ids })),
    unusedTopics: corpus.taxonomy.nodes
      .filter(
        (node) =>
          !corpus.entities.some(
            ({ entity }) =>
              entity.taxonomy.primaryTopicId === node.id ||
              entity.taxonomy.relatedTopicIds.includes(node.id),
          ),
      )
      .map((node) => node.id),
    maintenance: {
      unverifiedEntityIds: corpus.entities
        .filter((item) => !item.state.lastVerifiedAt)
        .map((item) => item.entity.id),
      openContradictions: corpus.entities
        .filter((item) => item.state.contradictions.length)
        .map((item) => ({ id: item.entity.id, questions: item.state.contradictions })),
      supervisedRealResearchCycles: "pending-owner-supervision",
      networkPublication: "disabled",
    },
  };
}
