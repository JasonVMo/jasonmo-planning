# Markdown data contract, version 1

Payload: `{ "bodyPath": "body.md" }`. The file is confined within the entity
directory, including symlink checks. No frontmatter-based metadata, MDX, JSX,
HTML, or executable code blocks. Managed markers must exactly match central
policy, without missing, duplicated, modified, or nested boundaries.

The compiler parses CommonMark using pinned `remark-parse`, validates links
and nodes, drops ownership comments, filters audience-hidden links (including
their labels), and serializes safe Markdown with `remark-stringify`.
Code blocks are inert text. GFM extensions are not enabled.

Links support HTTP(S), mailto, anchor fragments, and validated hash entity/topic
routes. Arbitrary relative filesystem links, script schemes, credentials in
URLs, remote images, and local assets are rejected. Assets are intentionally
not enabled until the browser DTO and owner asset policy can express approved
paths/digests; there is no success-shaped asset fallback.

Markdown adapts into all four independent common view schemas. Only the full
view receives the safe body, and only reachable view models are emitted.
Search receives bounded safe plain text, never raw evidence or source cursors.
