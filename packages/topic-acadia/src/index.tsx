import type { TopicDefinition } from "@jasonmo/common";
import Checklist from "./checklist.md";
import Hikes from "./hikes.md";
import Overview from "./overview.md";
import Stays from "./stays.md";
import ThingsToDo from "./things-to-do.md";
import Travel from "./travel.md";

export const topic: TopicDefinition = {
  id: "acadia",
  title: "Acadia",
  header: {
    title: "Acadia + New York",
    description: "October 4–13, 2026 trip plan",
  },
  rootPage: {
    id: "overview",
    title: "Overview",
    component: Overview,
    pages: [
      {
        id: "travel",
        title: "Travel",
        component: Travel,
      },
      {
        id: "hikes",
        title: "Hikes",
        component: Hikes,
      },
      {
        id: "stays",
        title: "Where to stay",
        component: Stays,
      },
      {
        id: "things-to-do",
        title: "Things to do",
        component: ThingsToDo,
      },
      {
        id: "checklist",
        title: "Check and reserve",
        component: Checklist,
      },
    ],
  },
};
