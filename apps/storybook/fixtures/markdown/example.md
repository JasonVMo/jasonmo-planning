# Embedded Markdown example

This **synthetic file** is loaded as text, not fetched by the browser.

## Formatting

| Source        | Renderer              |
| ------------- | --------------------- |
| File import   | `SafeMarkdown`        |
| Source string | **The same renderer** |

- [x] Bundle the file
- [ ] Review the page

~~Superseded wording~~ is still readable.

> A quote with an [external source](https://example.com/markdown).

```tsx
<SafeMarkdown>{source}</SafeMarkdown>
```
