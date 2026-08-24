import type { TopicDefinition, TopicPage } from "@jasonmo/common";
import { topicPath } from "@jasonmo/common";

export interface NavigationItem {
  readonly key: string;
  readonly label: string;
  readonly topic: TopicDefinition;
  readonly page: TopicPage;
  readonly depth: number;
}

function pageItems(
  topic: TopicDefinition,
  page: TopicPage,
  depth: number,
): readonly NavigationItem[] {
  const item = {
    key: topicPath(topic.id, page.id),
    label: page.title,
    topic,
    page,
    depth,
  };

  return [item, ...(page.pages ?? []).flatMap((child) => pageItems(topic, child, depth + 1))];
}

export function buildNavigation(topics: readonly TopicDefinition[]): readonly NavigationItem[] {
  return topics.flatMap((topic) => pageItems(topic, topic.rootPage, 0));
}
