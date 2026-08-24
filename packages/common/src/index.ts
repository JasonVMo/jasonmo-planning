import type { ComponentType } from "react";

export interface HeaderConfiguration {
  readonly title: string;
  readonly description?: string;
}

export interface TopicPage {
  readonly id: string;
  readonly title: string;
  readonly component: ComponentType;
  readonly pages?: readonly TopicPage[];
}

export interface TopicDefinition {
  readonly id: string;
  readonly title: string;
  readonly header: HeaderConfiguration;
  readonly rootPage: TopicPage;
}

export function topicPath(topicId: string, pageId: string): string {
  return `${topicId}/${pageId}`;
}
