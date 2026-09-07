import { performance } from "node:perf_hooks";
import { expect, it } from "vitest";
import type { SearchDocument } from "../packages/entity-model/src/index.ts";
import { createSearch, searchDocuments } from "../apps/site/src/search.ts";

it("searches 1,000 synthetic documents within the warm p95 budget", () => {
  const documents: SearchDocument[] = Array.from({ length: 1000 }, (_, index) => ({
    id: `synthetic-${index}`,
    title: `Research topic ${index}`,
    summary: `A synthetic summary for subject ${index % 20}`,
    body: "Local evidence and independent data views. ".repeat(20),
    tags: ["synthetic", `subject-${index % 20}`],
    primaryTopicId: "synthetic-topic",
    route: `#/entities/synthetic-${index}`,
  }));
  const index = createSearch(documents);
  expect(searchDocuments(index, "")).toEqual([]);
  expect(searchDocuments(index, "Research topic")).toHaveLength(1000);
  const elapsed: number[] = [];
  for (let attempt = 0; attempt < 100; attempt++) {
    const start = performance.now();
    expect(searchDocuments(index, `subject ${attempt % 20}`).length).toBeGreaterThan(0);
    elapsed.push(performance.now() - start);
  }
  elapsed.sort((left, right) => left - right);
  expect(elapsed[94]).toBeLessThan(100);
  console.log(`Search warm p95: ${elapsed[94]?.toFixed(2)} ms (1,000 documents, 100 queries)`);
});
