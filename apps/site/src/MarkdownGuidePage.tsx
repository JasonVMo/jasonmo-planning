import { SafeMarkdown } from "@tracker/entity-ui";
import guide from "./markdown/guide.md?raw";

const sourceExample = `## Markdown from a source string

Pass a JavaScript string as the renderer's children:

\`\`\`tsx
<SafeMarkdown>{"A **bold** statement and a [link](https://example.com)."}</SafeMarkdown>
\`\`\`

This **rendered example** is stored directly in TypeScript, not in a separate file.
Both forms support lists, tables, task lists, quotes, and code without executing markup.`;

export function MarkdownGuidePage() {
  return (
    <article className="markdown-guide">
      <header className="page-intro">
        <p className="eyebrow">Authoring guide</p>
        <h1>Markdown guide</h1>
        <p>Embed application copy from files or strings using one shared renderer.</p>
      </header>
      <SafeMarkdown>{guide}</SafeMarkdown>
      <SafeMarkdown>{sourceExample}</SafeMarkdown>
    </article>
  );
}
