import type { FullViewModel } from "@planning/entity-model";
import { SafeMarkdown } from "../markdown.tsx";

export function FullView({ title, summary, body }: FullViewModel) {
  return (
    <article className="tracker-full" data-view-type="full">
      <header className="tracker-full__header">
        <h1>{title}</h1>
        <p className="tracker-full__summary">{summary}</p>
      </header>
      <SafeMarkdown>{body}</SafeMarkdown>
    </article>
  );
}
