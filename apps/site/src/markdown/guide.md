## Markdown from a file

This section is embedded from a **source-authored Markdown file**. The build
includes its text in the JavaScript bundle: no Markdown file is fetched at
runtime, and the same content works in local development and built previews.

```tsx
import guide from "./guide.md?raw";
import { SafeMarkdown } from "@planning/entity-ui";

export function Guide() {
  return <SafeMarkdown>{guide}</SafeMarkdown>;
}
```

### Supported formatting

| Format   | Example                         |
| -------- | ------------------------------- |
| Emphasis | **Bold** and _italic_           |
| Code     | `inline code` and fenced blocks |
| Revision | ~~Old wording~~ and new wording |

- [x] File content is bundled
- [x] Markdown strings use the same renderer
- [ ] Add your own audience-safe application copy

> Source-authored embeds are application code, not private research. They are
> included in every audience's bundle. Keep canonical entity Markdown behind
> the content compiler and its ownership and publication rules.

Raw HTML, MDX/JSX execution, images, and unsafe links are not enabled.
Relative Markdown-file links are not copied or rewritten; use approved
absolute URLs or validated entity/topic hash routes.

Return to the [dashboard](#/).
