import type { SearchDocument } from "@planning/entity-model";
import MiniSearch from "minisearch";

export interface SearchHit {
  id: string;
  title: string;
  summary: string;
  route: string;
  score: number;
}

export function createSearch(documents: readonly SearchDocument[]) {
  const index = new MiniSearch<SearchDocument>({
    fields: ["title", "summary", "body", "tags"],
    storeFields: ["title", "summary", "route"],
    searchOptions: {
      boost: { title: 4, tags: 2, summary: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  index.addAll([...documents]);
  return index;
}

export function searchDocuments(index: MiniSearch<SearchDocument>, query: string): SearchHit[] {
  if (!query.trim()) return [];
  return index.search(query).flatMap((result) => {
    if (
      typeof result.id !== "string" ||
      typeof result.title !== "string" ||
      typeof result.summary !== "string" ||
      typeof result.route !== "string"
    ) {
      return [];
    }
    return [
      {
        id: result.id,
        title: result.title,
        summary: result.summary,
        route: result.route,
        score: result.score,
      },
    ];
  });
}
