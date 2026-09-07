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
