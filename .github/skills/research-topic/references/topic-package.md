# Topic package setup

A topic is a private Yarn workspace at `packages/topic-<name>` with `"type": "module"`. Source files
belong in `src`, and the package exports a named `topic` value implementing `TopicDefinition` from
`@jasonmo/common`.

The root page may contain nested pages. Each page supplies a stable ID, display title, and React
component. Components may be authored as `.tsx`, `.md`, or `.mdx`. Put downloaded images under
`src/assets` and import them from a component. Add the topic workspace as a site dependency; the
site prebuild task then generates the registry.

Package scripts must remain:

- `build`: `tsc`
- `lint`: `oxlint src`
- `test`: `node --test`
