# Markdown data contract, version 1

Payload: `{ "bodyPath": "body.md" }`. The file is confined within the entity
directory, including symlink checks. No frontmatter-based metadata, MDX, JSX,
HTML, or executable code blocks. Managed markers must exactly match central
policy, without missing, duplicated, modified, or nested boundaries.

The compiler parses CommonMark with pinned `remark-parse` and `remark-gfm`, validates links
and nodes, drops ownership comments, filters audience-hidden links (including
their labels), and serializes safe Markdown with `remark-stringify`.
Code blocks are inert text. GFM tables, task lists, strikethrough, and autolinks
use the same dialect as the browser renderer. Audience filtering traverses
these structures and nested link definitions before generating Markdown or
search text.

Links support HTTP(S), mailto, anchor fragments, and validated hash entity/topic
routes. Arbitrary relative filesystem links, script schemes, credentials in
URLs, remote images, and local assets are rejected. Assets are intentionally
not enabled until the browser DTO and owner asset policy can express approved
paths/digests; there is no success-shaped asset fallback.

Markdown adapts into all four independent common view schemas. Only the full
view receives the safe body, and only reachable view models are emitted.
Search receives bounded safe plain text, never raw evidence or source cursors.

The compiler's `projectMarkdown(body, file, audience)` accepts a Markdown
source string. The corpus loader supplies strings read from confined files;
the serialized manifest includes their projected text rather than a file
path or runtime fetch. Existing persisted entities continue to use `bodyPath`;
this change does not add a second inline-body field or convert content.

Source-authored application help can instead import `*.md?raw` and pass the
string to `SafeMarkdown`; this is bundled code, **not** audience-filtered
canonical content. Never import `content/`, `research/`, `references/`, or
`proposals/` files directly into browser code. See the README's Markdown
embedding examples and the `full` view specification.

Enabling GFM may change projections of existing Markdown containing GFM
syntax. There is no persisted schema migration; normal exact-digest approval
checks still reject stale broader-audience approvals after projected bytes
change. No approvals or publication settings are updated automatically.
