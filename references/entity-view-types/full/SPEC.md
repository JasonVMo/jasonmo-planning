# Full view, version 1

Schema: `FullViewModel` — exactly `title`, `summary`, entity-route `href`, and
`body` (safe Markdown **text**, not an AST). Compatible with `detail` and
`collection`; explicitly selecting full for navigation, search, or relationship
is a validation error. Detail default and Markdown fallback.

Render with `react-markdown`, `skipHtml`, safe link allowlisting, and no
raw-HTML/MDX/plugin execution. Remote and unapproved local images are disabled.
Maintain heading structure, readable code/quotes, visible focus, and wrapping
at narrow widths. A new data type may reuse this view by producing safe body
text in its code-owned adapter.

`SafeMarkdown` is also exported for code-owned page embeds. Its `children`
must be a Markdown string, either a JavaScript string or a `*.md?raw` import.
The site esbuild text loader embeds imported files in development and
production bundles; Storybook uses Vite's native raw imports. Missing imports
fail the build instead of fetching an unvalidated file at runtime.

Both compiler and renderer use GFM for tables, task lists, strikethrough, and
autolinks. Code fences remain inert, task checkboxes are labeled/read-only,
and top-level embedded headings are demoted below the page heading.
The shared model URL policy rejects relative file/asset URLs, protocol-relative
URLs, credentials, controls, and executable schemes. Browser rendering removes
unsafe link targets and omits HTML/images; canonical compilation rejects
unsafe input and additionally filters audience-hidden links.

Application Markdown files and string literals are included in every audience
bundle. They are suitable for reviewed app copy and synthetic demonstrations,
not private entity bodies or research. Canonical Markdown still enters the
browser exclusively through its publication-safe view model.
