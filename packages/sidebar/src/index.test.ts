import assert from "node:assert/strict";
import test from "node:test";
import type { TopicDefinition } from "@jasonmo/common";
import { buildNavigation } from "./navigation.ts";

const EmptyPage = () => null;

test("buildNavigation includes root pages and nested subpages", () => {
  const topic: TopicDefinition = {
    id: "planning",
    title: "Planning",
    header: { title: "Planning" },
    rootPage: {
      id: "overview",
      title: "Overview",
      component: EmptyPage,
      pages: [{ id: "details", title: "Details", component: EmptyPage }],
    },
  };

  assert.deepEqual(
    buildNavigation([topic]).map(({ key, depth }) => ({ key, depth })),
    [
      { key: "planning/overview", depth: 0 },
      { key: "planning/details", depth: 1 },
    ],
  );
});
