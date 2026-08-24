import type { TopicDefinition } from "@jasonmo/common";
import Intro from "./intro.md";
import Welcome from "./welcome.mdx";

export const topic: TopicDefinition = {
  id: "welcome",
  title: "Welcome",
  header: {
    title: "Jason Mo Planning",
    description: "Agent-assisted research and shared planning",
  },
  rootPage: {
    id: "overview",
    title: "Welcome",
    component: Welcome,
    pages: [
      {
        id: "research",
        title: "Research topics",
        component: Intro,
      },
    ],
  },
};
