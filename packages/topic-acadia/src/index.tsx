import type { TopicDefinition } from "@jasonmo/common";
import Overview from "./overview.md";

export const topic: TopicDefinition = {
  id: "acadia",
  title: "Acadia",
  header: {
    title: "Acadia",
    description: "Acadia planning and research",
  },
  rootPage: {
    id: "overview",
    title: "Overview",
    component: Overview,
  },
};
