# Durable architecture

This document contains the enduring engineering decisions for Tracker. Product
sequence and current work belong in [`NEXT.md`](../NEXT.md); installed versions
belong in `toolchain.md`; individual contracts belong in their data/view
specifications.

## Source and build boundaries

1. Canonical YAML/JSON, Markdown, taxonomy, policy, and research state are
   separate from browser projections.
2. Builds never retrieve external sources, invoke an agent, or advance content
   timestamps.
3. Audience filtering and relationship/citation closure happen before browser
   output. Client-side hiding is not a privacy boundary.
4. Browser DTOs are constructed with explicit allowlists. Never spread
   canonical objects and remove known-private fields afterward.
5. Identical canonical inputs, policy, audience, and base path produce
   byte-identical manifests. Build time, filesystem mtimes, absolute paths, and
   ambient clocks are excluded.
6. Failed compilation or bundling leaves the previous valid artifact intact.
7. Artifact audits inspect HTML, JavaScript, CSS, JSON, search data, filenames,
   source maps, credentials, machine paths, restricted inputs, and private
   canaries.

## Runtime and dependency boundaries

```text
entity-model
   ^             ^
   |             |
content-pipeline entity-ui
                     ^
                     |
                site / storybook
```

| Project            | Owns                                                                                | Must not depend on                                          |
| ------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `entity-model`     | JSON Schemas, generated types, dependency-light guards/constants                    | React, Fluent UI, Node filesystem APIs, applications        |
| `content-pipeline` | Node-only loading, validation, projection, adapters, research state, reconciliation | React, Fluent UI, application components                    |
| `entity-ui`        | React/Fluent providers and renderers keyed by view type                             | Node filesystem APIs, canonical content, research state     |
| `site`             | Shell, routes, browser search, manifest consumption                                 | Canonical parsing, research state, approval records         |
| `storybook`        | Synthetic visual, interaction, and accessibility fixtures                           | Canonical/private content, research state, deployment logic |

Nx orchestrates package scripts; leaf scripts invoke the actual tools. Add a
package only for a real runtime, dependency, testing, distribution, or ownership
boundary. Shared packages remain source-only until another consumer needs
published artifacts.

## Canonical identity and composition

- JSON Schema draft-07 is the persisted contract authority. Ajv performs
  runtime validation; TypeScript declarations are generated and drift-checked.
- Stable IDs never encode taxonomy or filesystem placement and are never
  recycled.
- Entity directories remain flat at `content/entities/<stable-id>/`.
- Taxonomy is owner-controlled global navigation, not a substitute for
  entity-level composition.
- New data types require a schema, version, specification, migration decision,
  projection semantics, adapters, and fixtures.
- New view types require a strict browser model, context compatibility,
  renderer, Storybook states, and actual-site coverage.
- Data types and view types are independent. Code-owned data-to-view adapters
  connect them; renderers dispatch only on a closed view-type registry.
- Content can select registered view types but cannot name components, import
  paths, modules, JSX, or arbitrary props.
- Markdown remains inert: no MDX, JSX, raw HTML, scriptable URLs, or arbitrary
  plugins.
- Generic composition is introduced only after repeated non-trip cases need
  it. Bounded trip composition should precede a general page-builder.

## Site architecture

- The product is a client-rendered static React SPA using stable hash routes.
- esbuild owns the actual site development and production bundle. Vite is
  isolated to Storybook, so actual-site Playwright coverage is mandatory.
- The site is tested at root and nested `/tracker/` base paths.
- Browser search uses MiniSearch over an audience-filtered document list from
  the content pipeline. It never indexes private operational state, source
  cursors, internal errors, or hidden entities.
- Site and Storybook share the Fluent provider and accessible view renderers.
- Routes update the document title and focus, provide skip navigation and
  visible focus, avoid horizontal overflow at 320 CSS pixels, and support dark
  and forced-colors modes.
- Retired IDs remain reserved. Redirects or tombstones require explicit route
  support and cannot be claimed from taxonomy metadata alone.

## Publication model

The browser never receives ownership rules, research cursors, approval records,
canonical paths, machine paths, or unapproved source locators.

| Audience        | Content boundary                                  | Deployment                                      |
| --------------- | ------------------------------------------------- | ----------------------------------------------- |
| `local`         | Repository content permitted for local viewing    | Never deployable                                |
| `private-owner` | Owner-eligible projection                         | Requires proven owner-only host authorization   |
| `private-group` | Explicitly selected and approved group projection | Requires exact approval and group authorization |
| `public`        | Public-eligible, non-personal projection          | Disabled unless explicitly approved             |

Repository visibility and client-side login UI are not access controls. Private
hosting must deny unauthorized direct requests for every artifact class.
Revocation requires a clean rebuild of content, search, relationships, and
assets. Rollback may use only an artifact valid under current policy.

The current workflow builds the private-owner project site into tracked
`docs/`, including `.nojekyll`, but deliberately does not deploy it. The
manifest remains non-deployable until publication policy and access gates are
explicitly changed.

## Generated and operational artifacts

Commit:

- the lockfile;
- authoritative schemas;
- deterministic generated declarations needed for review/editors;
- tracked `docs/` Pages output;
- generation provenance required by a contract.

Do not commit:

- dependencies, Nx cache, `.generated/`, `dist/`, or Storybook output;
- source maps, coverage, screenshots, browser traces, or transient test output;
- raw downloads, browser dumps, session transcripts, or tool logs;
- credentials, local leases, journals, or machine-local paths.

Generation checks use isolated temporary output and compare bytes. They do not
silently repair tracked files. The `docs/` directory is the intentional
exception to the general rule that site bundles are disposable.

## Acceptance and risk controls

`corepack yarn check` is the repository acceptance command. It covers
toolchain/workspace checks, formatting, schema drift, complete content
validation, type checking, linting, unit/integration tests, site/Storybook
builds, Storybook accessibility/interaction tests, and actual-site browser
tests.

Maintain representative tests for:

- invalid schemas, paths, timestamps, ownership, and view selection;
- duplicate IDs, dangling references, cycles, audience closure, and stale
  approvals;
- deterministic serialization and preservation of the last valid artifact;
- source outage, contradiction, partial research, stale hashes, and concurrent
  proposals;
- root/nested routes, search, safe Markdown, keyboard/focus behavior, narrow
  layout, themes, and forced colors;
- synthetic private markers and forbidden files in every broader artifact.

Do not weaken these controls to make a fixture or deployment succeed.

## Deferred decisions and triggers

| Decision                            | Revisit only when                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| Generic collection/page composition | At least one non-trip feature needs the same ordered embedding semantics                   |
| SSG or prerendering                 | Indexing, social metadata, no-JavaScript access, or measured route performance requires it |
| TypeScript 6 compatibility removal  | Every API consumer passes against the replacement compiler API                             |
| Remote cache                        | Local/CI duration justifies it and the trust boundary is approved                          |
| External or semantic search         | Measured local relevance, size, or latency misses an agreed budget                         |
| Visual snapshot service             | Recurring visual regressions justify another service                                       |
| Notifications or calendar sync      | The repository workflow is useful and canonical direction/access are designed              |
| Service worker/offline mode         | A real offline need outweighs private-content cache risk                                   |
| Backend, database, or CMS           | Static canonical files no longer meet an observed editing or query requirement             |

Rejected patterns remain: taxonomy-mirrored folders, browser-side privacy
filtering, arbitrary data-named components, MDX, hand-maintained competing
schema/type authorities, scheduled direct writes to `main`, committed
distributed locks, and copying public source text by default.
