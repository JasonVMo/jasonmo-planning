import type { FullViewModel } from "@planning/entity-model";
import { Subtitle1, Title1 } from "@fluentui/react-components";
import { SafeMarkdown } from "../markdown.tsx";

export function FullView({ title, summary, body }: FullViewModel) {
  return (
    <article className="tracker-full" data-view-type="full">
      <header className="tracker-full__header">
        <Title1 as="h1">{title}</Title1>
        <Subtitle1 as="p">{summary}</Subtitle1>
      </header>
      <SafeMarkdown>{body}</SafeMarkdown>
    </article>
  );
}
