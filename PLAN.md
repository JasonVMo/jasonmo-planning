# Tracker Repository Stand-up and Structuring Plan

**Plan status:** Decision-ready repository bootstrap plan
**Research date:** 2026-09-04, America/Los_Angeles
**Target repository:** `jasonmo_microsoft/tracker`
**Default posture:** Private, local-first, deterministic, and agent-maintainable

This plan uses the following evidence labels:

- **Observed:** Directly verified in the repository, governing workflow, package
  metadata, or primary documentation.
- **Inferred:** A conclusion drawn from observations.
- **Recommended:** A design or implementation decision established by this
  plan.

## 1. Objective

Build a private research repository that agents can incrementally refresh and
organize, with a React static website that presents an explicitly selected
projection of the repository's canonical content.

The durable outcome is not merely a website. It is a repository with:

1. A validated, versioned content model for YAML or JSON entities and Markdown.
2. A deterministic compiler from canonical content to browser-safe data.
3. Reusable React renderers backed by Fluent UI React v9.
4. A responsive, searchable static site.
5. A Storybook application that defines the visual contract for each entity
   kind and presentation variant.
6. Agent workflows that can resume research, propose changes, preserve manual
   ownership, and fail safely.
7. Publication controls that prevent private research from entering a broader
   audience artifact without explicit authorization.

### 1.1 Scope

The initial repository will support:

- One canonical `markdown` entity kind.
- Four code-owned presentation variants: `label`, `tile`, `card`, and `full`.
- Stable taxonomy and entity identities.
- Typed entity relationships.
- Provenance and claim-to-source linkage.
- Research continuation state and concise run outcomes.
- Local navigation and search.
- Local static builds for distinct audiences.
- Supervised agent research, refinement, organization, and reconciliation.

### 1.2 Non-goals for initial stand-up

- Public launch.
- Browser-based content editing.
- A backend, database, CMS, or runtime content API.
- Server-side rendering or per-route static HTML generation.
- MDX, JSX, executable Markdown, or data-selected React components.
- Semantic search, embeddings, a vector database, or an external search
  service.
- Scheduled unattended agent writes.
- Nx Cloud, remote caching, or remote execution.
- Public Storybook hosting.
- Broad source ingestion or copying content merely because this repository is
  private.
- A generic plugin system or one package per entity kind.

### 1.3 Success criteria

The initial system is successful when:

- A clean checkout can reproduce the dependency graph and run `yarn check`
  without undocumented global tools.
- Nx discovers the two applications and three shared packages.
- TypeScript 7 performs repository type checking while TypeScript 6 remains
  available to tools that require the legacy compiler API.
- Two linked Markdown entities can be authored without editing React code and
  then appear in navigation, topic collections, direct routes, relationships,
  and search.
- Every registered entity variant has a synthetic Storybook story.
- Invalid content fails with file-, entity-, and field-specific diagnostics.
- Repeated compilation of identical inputs produces byte-identical manifests.
- A synthetic private canary is absent from every broader-audience manifest,
  search document, asset, and bundle.
- A failed research refresh preserves the last valid content and does not
  advance successful-verification timestamps.
- Agents cannot grant themselves ownership or publication approval.
- Online deployment remains impossible until its runner, host, audience,
  authorization, and approval gates are explicitly closed.

## 2. Observed starting state and platform constraints

### 2.1 Repository state

**Observed on 2026-09-04:**

- The repository is private and owned by the Enterprise Managed User
  `jasonmo_microsoft`.
- The default branch is `main`.
- `main` and `origin/main` point to the initial plan commit.
- `PLAN.md` is the only tracked file.
- The repository has no issues and no branches other than `main`.
- There is no implementation or migration burden to preserve.
- No directly overlapping workstream was found in the canonical personal
  workflow dashboard.

### 2.2 Enterprise Managed User constraints

These constraints materially change a conventional GitHub bootstrap:

- GitHub-hosted Actions runners are not available to repositories owned by a
  managed user account.
- Copilot cloud agent is not available in personal repositories owned by a
  managed user account because it depends on GitHub-hosted runners.
- Enterprise Managed User Pages sites can only be published from
  organization-owned repositories and are always private.
- Therefore this user-owned repository cannot directly use the common
  GitHub-hosted Actions to GitHub Pages path.

**Implication:** Local commands are the authoritative validation surface until
an approved self-hosted runner, external CI service, or repository ownership
change is selected. A workflow file that never executes is not working CI.

**Implication:** Initial agent workflows run through local Copilot CLI or
another explicitly approved environment. Unattended agent execution is a later
platform decision.

**Sources:** [Managed user abilities and restrictions][github-emu-restrictions]
and [GitHub Pages limits for Enterprise Managed Users][github-emu-pages].

### 2.3 Governing workflow consequences

The repository adopts these established personal workflow decisions:

- Credentials and explicitly restricted content are never committed.
- Raw transcripts, prompts, routine tool output, and machine-local paths are
  not canonical research records.
- Manual, agent-managed, and generated ownership boundaries are explicit.
- Agents begin from a lightweight repository index and load detailed context
  on demand.
- Human-facing timestamps use an explicit UTC offset.
- Weekly operating review and monthly maintenance are the default cadence.
- Large or binary originals remain in their source system; the repository
  stores links, metadata, and permitted summaries.
- Internal branches use `user/jasonmo/<purpose>`.

## 3. Toolchain findings and compatibility baseline

Compatibility claims below are evidence from 2026-09-04. Exact versions become
repository authority only after Phase 0 installs and tests them together.

| Area | Finding | Plan consequence |
| --- | --- | --- |
| Yarn | Yarn 4 supports `nodeLinker: pnpm` as a stable, first-class linker. | Use Yarn commands, `yarn.lock`, and `.yarnrc.yml`; do not add pnpm CLI instructions or `pnpm-lock.yaml`. |
| Nx | Nx can discover workspace packages and orchestrate ordinary package scripts. | Leaf scripts remain understandable without Nx; Nx adds graph ordering and local caching. |
| TypeScript | TypeScript 7.0 is released, but it does not ship the stable legacy compiler API expected by current ecosystem tools. Microsoft and Nx document a TypeScript 6 compatibility alias. | Use TypeScript 7 for `tsc` and keep TypeScript 6 available as `typescript`/`tsc6` until representative tools support the replacement API. |
| React and Fluent | React 19 is within the declared peer range of the current Fluent UI React v9 aggregate package. | Pin matching React and React DOM versions and verify one Fluent render in Phase 0. |
| Fluent navigation | The current Fluent Nav and Drawer source documentation contains production-readiness warnings. | Build the initial shell with semantic HTML, CSS, and stable Fluent primitives; reevaluate Nav and Drawer later. |
| Storybook | Storybook's React/Vite framework is supported, but the current Storybook Vitest addon accepts Vitest 3 or 4 rather than Vitest 5. | Pin a tested Storybook/Vitest 4 combination rather than selecting every latest major. |
| Vite | Vite 8 uses Rolldown/Oxc rather than esbuild for its browser pipeline. | Use Vite only for the selected Storybook framework. Do not claim that Storybook and the site exercise one bundler. |
| esbuild | esbuild bundles TS/JSX, CSS, and browser assets, and supports watch/serve, but it does not typecheck and does not provide JavaScript HMR. | esbuild owns the site development and production bundle. Type checking is separate; local development initially uses full-page reload. |
| Oxlint/Oxfmt | Both tools support the planned source formats; Oxfmt remains pre-1.0 and may change formatting behavior. | Pin exact versions, smoke-test representative YAML/Markdown/generated files, and review formatter upgrades explicitly. |
| Hosting/CI | GitHub-hosted runners and direct Pages are unavailable under the repository's current ownership. | Do not claim CI or deployment until an approved execution and hosting path is proven. |

### 3.1 Candidate Phase 0 version set

The Phase 0 spike starts with the observed set below. It may adjust a patch or
minor only when the tested replacement and reason are recorded in
`references/toolchain.md`.

| Tool | Candidate version |
| --- | --- |
| Node.js | `24.20.0` |
| Yarn | `4.18.0` |
| Nx and selected Nx plugins | `23.2.0` |
| React / React DOM | `19.2.8` |
| Fluent UI React components | `9.74.7` |
| TypeScript 7 executable alias | `typescript@7.0.2` |
| TypeScript 6 compatibility API | `@typescript/typescript6@6.0.2` |
| esbuild | `0.28.2` |
| Oxlint | `1.81.0` |
| Oxfmt | `0.66.0` |
| Storybook packages | `10.6.0` |
| Vite, for Storybook only | `8.2.2` |
| Vitest and browser adapter | `4.1.11` |
| `tsx`, for unbundled development scripts | `4.23.13` |

Additional direct dependencies such as Ajv, `ajv-formats`, `yaml`,
`json-schema-to-typescript`, React Router, MiniSearch, `react-markdown`,
Playwright, and React type declarations must also be pinned by the Phase 0
lockfile. Do not leave floating `latest` ranges in committed setup.

### 3.2 TypeScript installation contract

The root manifest follows the documented dual-install pattern:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@7.0.2",
    "typescript": "npm:@typescript/typescript6@6.0.2"
  }
}
```

The toolchain check must prove:

```text
yarn tsc --version   -> 7.0.x
yarn tsc6 --version  -> 6.0.x
```

The compatibility alias can be removed only after Nx, Storybook, schema
generation, editor integration, and all repository scripts pass against the
replacement TypeScript API. The existence of a later TypeScript release alone
is not sufficient.

## 4. Fixed architecture decisions

1. **Canonical content is separate from presentation.** YAML/JSON descriptors,
   Markdown, taxonomy, research state, policies, and approvals are sources.
   Browser manifests, search indexes, navigation trees, and bundles are
   generated projections.
2. **Builds never research.** Builds do not fetch external sources, invoke an
   agent, or advance content timestamps.
3. **The first site is a client-rendered static SPA.** Hash routes avoid host
   rewrite requirements. SSR/SSG is deferred.
4. **esbuild owns the site browser bundle.** One small, code-owned site script
   handles the HTML shell, assets, base path, watch mode, and static preview.
   This honors the requested stack and keeps development and production on the
   same application pipeline.
5. **Vite is isolated to Storybook.** Storybook uses its supported React/Vite
   integration. Site end-to-end tests are mandatory because Storybook does not
   validate the esbuild path.
6. **Nx orchestrates; package scripts explain.** Package scripts invoke the
   actual tools. Root Nx tasks compose those scripts without recursive aliases.
7. **Three packages represent three runtime boundaries.**
   `entity-model` is browser-safe contracts, `content-pipeline` is Node-only
   parsing/validation/compilation, and `entity-ui` is React/Fluent rendering.
8. **JSON Schema draft-07 is the persisted contract authority.** Ajv validates
   at runtime. TypeScript declarations are generated and normalized with
   Oxfmt. Cross-file graph and policy rules remain explicit code.
9. **Stable IDs do not encode paths or taxonomy.** Moving an entity in
   navigation does not change its identity or storage directory.
10. **Data cannot select executable code.** Entity kind and presentation
    variant are closed enums mapped through a code-owned renderer registry.
11. **Markdown is non-executable.** No MDX, JSX, raw HTML, arbitrary plugins,
    or scriptable URL schemes.
12. **Audience filtering occurs before browser output.** A React component that
    hides data is not a publication boundary.
13. **One reconciliation writer promotes canonical changes.** Parallel agents
    may prepare isolated proposals; optimistic hashes and whole-graph
    validation protect promotion.
14. **Agents cannot self-authorize.** Ownership policy and publication
    approvals live outside entity-authored data.
15. **The thin vertical slice precedes breadth.** Start with Markdown. Add an
    entity kind only after recurring content proves its value.

## 5. Proposed repository structure

Items marked `[later]` are created only when their phase begins.

```text
tracker/
├── PLAN.md
├── README.md
├── AGENTS.md
├── package.json
├── yarn.lock
├── .yarnrc.yml
├── .node-version
├── nx.json
├── tsconfig.base.json
├── .oxlintrc.json
├── .oxfmtrc.json
├── .editorconfig
├── .gitattributes
├── .gitignore
│
├── .github/
│   ├── copilot-instructions.md
│   ├── instructions/
│   │   ├── content.instructions.md
│   │   └── website.instructions.md
│   ├── skills/
│   │   ├── research-topic/SKILL.md
│   │   ├── refine-website/SKILL.md
│   │   ├── organize-site/SKILL.md
│   │   └── reconcile-content/SKILL.md
│   └── workflows/                         # [later] only after runner gate
│       ├── validate.yml
│       ├── refresh.yml                    # [later] proposal-only
│       └── deploy.yml                     # [later] separate permissions
│
├── apps/
│   ├── site/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── index.template.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── routes.tsx
│   │   │   ├── shell/
│   │   │   ├── pages/
│   │   │   ├── search/
│   │   │   └── styles/
│   │   ├── tests/
│   │   │   └── site.spec.ts
│   │   └── .generated/                    # ignored, audience-separated
│   │       ├── local/
│   │       ├── private-owner/
│   │       ├── private-group/
│   │       └── public/
│   └── storybook/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── .storybook/
│       │   ├── main.ts
│       │   └── preview.tsx
│       └── fixtures/                      # synthetic data only
│
├── packages/
│   ├── entity-model/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── schemas/
│   │   │   ├── entity.schema.json
│   │   │   ├── taxonomy.schema.json
│   │   │   ├── research-state.schema.json
│   │   │   ├── run-outcome.schema.json
│   │   │   ├── ownership-policy.schema.json
│   │   │   ├── publication-approval.schema.json
│   │   │   ├── site-manifest.schema.json
│   │   │   └── kinds/
│   │   │       └── markdown.schema.json
│   │   ├── src/
│   │   │   ├── generated/types.ts
│   │   │   ├── constants.ts
│   │   │   └── index.ts
│   │   └── tests/
│   ├── content-pipeline/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── cli.ts
│   │   │   ├── load.ts
│   │   │   ├── validate.ts
│   │   │   ├── graph.ts
│   │   │   ├── ownership.ts
│   │   │   ├── project.ts
│   │   │   ├── search-documents.ts
│   │   │   ├── reconcile.ts
│   │   │   └── diagnostics.ts
│   │   └── tests/
│   └── entity-ui/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── registry.tsx
│           ├── EntityRenderer.tsx
│           ├── TrackerProvider.tsx
│           ├── generic/
│           ├── markdown/
│           │   ├── MarkdownEntity.tsx
│           │   └── MarkdownEntity.stories.tsx
│           ├── relationships/
│           └── index.ts
│
├── content/
│   ├── README.md
│   └── entities/
│       └── <stable-entity-id>/
│           ├── entity.yaml                # or entity.json, never both
│           ├── body.md                    # kind-specific
│           └── assets/                    # small approved assets only
│
├── references/
│   ├── toolchain.md
│   ├── taxonomy.yaml
│   ├── taxonomy-rules.md
│   ├── entity-types/
│   │   ├── base/SPEC.md
│   │   └── markdown/SPEC.md
│   ├── agents/
│   │   ├── operating-contract.md
│   │   ├── evidence-rules.md
│   │   └── reconciliation.md
│   ├── ownership/
│   │   ├── README.md
│   │   └── policies.yaml
│   ├── publication/
│   │   ├── policy.md
│   │   └── approvals/                     # target- and digest-bound
│   └── sources/
│       └── README.md
│
├── research/
│   ├── README.md                          # never automatically published
│   ├── topics/
│   │   └── <entity-id>/
│   │       ├── state.yaml
│   │       ├── sources.yaml
│   │       ├── evidence.md
│   │       └── runs/
│   │           └── <run-id>.yaml
│   └── .local/                            # ignored downloads/tool output
│
├── proposals/                             # agent proposals, not publication input
│   └── <run-id>/
│       ├── manifest.yaml
│       └── changes/
│
├── scripts/
│   ├── doctor.mts
│   ├── site.mts                          # esbuild dev/build/preview wrapper
│   ├── build-tools.mts
│   ├── generate-types.mts
│   ├── check-boundaries.mts
│   └── audit-artifact.mts
│
└── dist/                                  # ignored, audience-separated
    ├── local/
    ├── private-owner/
    ├── private-group/
    └── public/
```

### 5.1 Right-sizing rules

- Do not initially create packages for search, taxonomy, themes, agents, or
  each entity kind.
- Keep browser search in `apps/site` until another consumer exists.
- Keep search-document generation in `content-pipeline`.
- Keep theme/provider code in `entity-ui` while site and Storybook are its only
  consumers.
- Add a package only when a runtime, dependency, testing, distribution, or
  ownership boundary requires it.
- Keep shared packages source-only initially. The site, Storybook, and bundled
  content-pipeline CLI are the meaningful build outputs.

## 6. Workspace dependency and ownership boundaries

### 6.1 Dependency direction

```text
entity-model
   ^             ^
   |             |
content-pipeline entity-ui
                     ^
                     |
                site / storybook
```

| Project | May depend on | Must not depend on |
| --- | --- | --- |
| `entity-model` | Dependency-light schema/type helpers | React, Fluent UI, Node filesystem APIs, apps |
| `content-pipeline` | `entity-model`, Ajv, YAML parser, Node APIs | React, Fluent UI, app components |
| `entity-ui` | `entity-model`, React, Fluent UI, safe Markdown renderer | Node filesystem APIs, canonical `content/`, research state |
| `site` | `entity-model`, `entity-ui`, MiniSearch, generated `SiteManifest` | Canonical YAML/Markdown parsing, research state, approval records |
| `storybook` | `entity-model`, `entity-ui`, synthetic fixtures | Canonical private content, `research/`, deployment code |

`content-pipeline` may be bundled as a Node ESM CLI with esbuild. Shared source
packages do not gain independent declaration/build pipelines until a real
consumer needs package artifacts.

### 6.2 Canonical ownership

| Path | Authority |
| --- | --- |
| `content/**` | Canonical entity content under central ownership policy |
| `references/taxonomy.yaml` | Canonical navigation taxonomy; owner review for global restructuring |
| `references/entity-types/**` and model schemas | Canonical kind semantics and persisted contracts |
| `references/ownership/**` | Owner-controlled write permissions; agents cannot broaden them |
| `references/publication/**` | Owner-controlled publication policy and approvals |
| `research/topics/**` | Durable continuation state, curated evidence, and concise outcomes |
| `proposals/**` | Reviewable agent proposals; never a site input |
| `apps/**` and `packages/**` | Application and library source |
| `.generated/**` and `dist/**` | Disposable generated output |

Mixed Markdown ownership uses explicit managed-region markers. The central
ownership policy identifies allowed JSON Pointers and marker names. An entity
may reference a policy ID but cannot define new permissions.

Missing, duplicated, nested, or modified ownership markers are validation
errors. A writing workflow stops rather than replacing the entire file.

## 7. Canonical content contracts

### 7.1 Storage and parsing

- Each entity uses `content/entities/<stable-id>/`.
- The directory contains exactly one of `entity.yaml`, `entity.yml`, or
  `entity.json`; duplicate formats are invalid.
- YAML is parsed as YAML 1.2 into JSON-compatible values.
- Reject duplicate keys, multiple documents, custom tags, merge keys,
  aliases/anchors, non-string mapping keys, and non-JSON values.
- Schemas are strict: unknown fields fail unless a schema explicitly permits
  an extension point.
- `$ref` is local and allowlisted; validation never downloads schemas.
- Paths are normalized repository-relative paths. `bodyPath` and asset paths
  must remain inside the entity directory after symlink resolution.
- IDs use lowercase kebab case, are globally unique, and are never recycled.
- Offset-bearing ISO 8601 timestamps are required.
- Schema migrations are explicit commands and never silent reader rewrites.

### 7.2 Entity envelope

| Field | Contract |
| --- | --- |
| `schemaVersion` | Integer version of the common envelope |
| `id` | Immutable global stable ID |
| `kind` / `kindVersion` | Registered kind and integer kind contract version |
| `title` / `summary` | Plain text within documented size limits |
| `lifecycle` | `draft`, `active`, or `archived`; separate from freshness and publication |
| `taxonomy` | One primary topic ID plus optional related topic IDs and tags |
| `relationships` | Typed edges to entity IDs |
| `presentation` | Default and permitted variants from the closed variant enum |
| `data` | Kind-specific validated payload |
| `provenance` | Sources and material claim-to-source links |
| `sensitivity` | Content sensitivity, separate from publication eligibility |
| `capturePolicy` | What may be copied from the source: `link-only`, `summary-allowed`, or `quotation-allowed` |
| `publication` | Eligibility and requested target classes; never approval |
| `ownershipPolicyId` | Reference to an owner-controlled policy |
| `refresh` | Workflow, cadence, and durable state ID |
| `timestamps` | Created and meaningful-content-updated times |
| `review` | Last substantive review and next review |

Initial relationship kinds are:

- `related-to`
- `depends-on`
- `supersedes`

General relationships may contain cycles. Composition is not part of the base
envelope. If repeated content proves a `collection` kind is useful, its typed
payload will define ordered child entity IDs and variants. Composition must
then be acyclic, bounded, and complete for the selected audience.

### 7.3 Representative Markdown entity

```yaml
schemaVersion: 1
id: typescript-7-toolchain
kind: markdown
kindVersion: 1

title: TypeScript 7 toolchain compatibility
summary: Tracks the compatibility boundary between TypeScript 7 and repository tooling.
lifecycle: active

taxonomy:
  primaryTopicId: engineering-tooling
  relatedTopicIds:
    - agent-systems
  tags:
    - typescript
    - tooling

relationships:
  - kind: related-to
    targetId: tracker-repository-architecture

presentation:
  defaultVariant: full
  permittedVariants:
    - label
    - tile
    - card
    - full

data:
  bodyPath: body.md

provenance:
  sources:
    - id: typescript-7-announcement
      title: Announcing TypeScript 7.0
      publisher: Microsoft TypeScript
      sourceType: primary-documentation
      url: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
      access: public
      retrievedAt: "2026-09-04T16:17:19-07:00"
  claims:
    - id: typescript-7-api-transition
      basis: observed
      statement: TypeScript 7.0 does not ship the stable legacy compiler API expected by current tools.
      sourceIds:
        - typescript-7-announcement

sensitivity:
  classification: private
  containsPersonalData: false

capturePolicy: summary-allowed

publication:
  eligibility: private-owner
  requestedTargets: []

ownershipPolicyId: mixed-research-summary-v1

refresh:
  workflow: research-topic
  cadence: P30D
  stateId: typescript-7-toolchain

timestamps:
  createdAt: "2026-09-04T16:17:19-07:00"
  updatedAt: "2026-09-04T16:17:19-07:00"

review:
  nextReviewAt: "2026-10-04T16:17:19-07:00"
```

The corresponding `body.md` has no frontmatter:

```markdown
# TypeScript 7 toolchain compatibility

This owner-maintained introduction establishes why the topic matters.

<!-- BEGIN AGENT-MANAGED: research-summary -->

TypeScript 7 is available through the normal package, while current
compiler-API consumers require the documented TypeScript 6 compatibility
package.

<!-- END AGENT-MANAGED: research-summary -->
```

### 7.4 Taxonomy contract

`references/taxonomy.yaml` is canonical. Each node has:

- Stable ID.
- Display title and short slug.
- Description.
- Optional parent ID.
- Deterministic order.
- Sensitivity and publication eligibility.
- Optional retired slugs or IDs for redirects/tombstones.

The validator rejects cycles, missing parents, duplicate sibling slugs, and
unknown entity placements. Moving an entity changes metadata, not storage or
identity. Audience projection filters taxonomy metadata as well as entities;
pruning empty branches alone is not sufficient to prevent a sensitive label
leak.

### 7.5 Markdown contract

- Use `react-markdown` with raw HTML disabled and `skipHtml`.
- Permit only a documented CommonMark/GFM subset.
- Use a code-owned element map for Fluent-styled output.
- Permit `https`, `http`, `mailto`, and validated relative links only.
- Remote images are not fetched at build or runtime.
- Local assets must pass type, size, path, and publication checks.
- Do not initially add custom `entity:` or `source:` Markdown syntax. Entity
  relationships and provenance remain structured fields until repeated use
  justifies a tested extension.
- No MDX, JSX, inline script, iframe, arbitrary rehype plugin, data-provided
  component, or executable code block behavior.

### 7.6 Research state and outcomes

`research/topics/<id>/state.yaml` stores operational state rather than
duplicating article prose:

- State schema version and entity/topic ID.
- Current bounded objective.
- Operational status: `active`, `paused`, or `blocked`.
- Completed and remaining subtopics.
- Source cursors, revisions, ETags, or fingerprints when useful.
- Last attempt timestamp and outcome.
- Last successful retrieval/verification timestamp.
- Last substantive review timestamp.
- Open questions, contradictions, retry eligibility, and next action.
- Next human review.

Fresh/due/stale is computed from cadence and the last successful verification.
A failed attempt never advances successful verification. A later successful
verification is a new event even when conclusions do not change.

Each supervised run writes one concise outcome under `runs/` containing:

- Run ID, workflow, base revision, and request key.
- Scope and source evidence.
- Changed entity IDs.
- Validation summary.
- Start/end timestamps and explicit offset.
- Outcome: `succeeded`, `no-change`, `partial`, `blocked`, or `failed`.
- Decisions requiring owner review and continuation pointer.

Raw prompts, transcripts, browser dumps, stack traces, tool logs, and
credentials are not run outcomes.

## 8. Browser-safe projection and publication model

### 8.1 Explicit browser DTO

The browser never receives canonical entity objects. `SiteManifest` is a
separate strict schema constructed by allowlisting fields. It contains only:

- Manifest and policy versions.
- Audience and content digest.
- Safe taxonomy nodes.
- Entity ID, kind/version, title, summary, route, and visible lifecycle.
- Allowed presentation variants.
- Audience-safe Markdown/plain-text content.
- Audience-safe relationship labels and targets.
- Audience-safe provenance links and claim labels.
- Computed visible freshness state where policy allows it.
- Approved local asset paths and digests.

It excludes by default:

- Ownership rules and managed paths.
- Research cursors, connector details, internal errors, and retry state.
- Approval records and reviewer data.
- Canonical file paths and machine paths.
- Internal source locators or URLs not approved for the audience.
- Private taxonomy labels, hidden relationship targets, and omitted counts.
- Raw entity descriptors and research evidence files.

Projection code creates DTOs through explicit field selection. It must never
spread a canonical object and delete a list of known-private fields.

### 8.2 Audience classes

| Audience | Content rule | Approval rule | Deployable |
| --- | --- | --- | --- |
| `local` | All repository content permitted for local viewing | None beyond repository access | No; build is marked non-deployable |
| `private-owner` | Content eligible for owner-only authenticated viewing | Merge/review on `main` plus explicit deployment action | Only after host proves owner-only authorization |
| `private-group` | Only content approved for a named authenticated group | Exact projected-content approval | Only after host proves group authorization |
| `public` | Only public-eligible content and public-safe references | Exact projected-content approval and explicit public destination | Disabled by default |

Repository visibility is not a substitute for site audience authorization.
Even an authenticated site can expose material more broadly than the owner.

### 8.3 Approval records

Private-group and public approval records live outside entity data and contain:

- Target class and concrete deployment identifier.
- Selected entity IDs.
- SHA-256 digest of the exact normalized browser projection.
- Digests of included taxonomy, citations, assets, and composition closure.
- Policy version.
- Reviewer identity and approval timestamp.
- Optional expiration or required re-review date.

Changing any approved projected byte invalidates the approval. Hidden
operational fields that never enter the projection do not invalidate it.
Entities and research agents cannot author approval records.

### 8.4 Compilation sequence

Whole-corpus validation and audience projection are distinct:

1. Discover canonical descriptors, taxonomy, policies, approvals, and state.
2. Parse strict JSON-compatible values.
3. Validate schemas, IDs, paths, timestamps, ownership, provenance, and the
   complete graph.
4. Resolve the requested audience and policy version.
5. Select eligible entities and taxonomy metadata.
6. Load only selected presentation content and assets for the browser
   projection.
7. Validate audience-specific relationship, citation, asset, and composition
   closure.
8. Construct strict `SiteManifest` DTOs through field allowlists.
9. Derive backlinks, navigation, and search documents from those DTOs.
10. Serialize with stable ordering, line endings, and key ordering.
11. Write to a target-specific staging directory.
12. Build and audit the complete target artifact.
13. Atomically replace the target's last valid generated/output directories.

On failure, remove staging output and leave the previous valid local artifact
untouched. No failed artifact becomes deployable.

### 8.5 Determinism and digest rules

- Sort entities by stable ID and ordered collections by explicit order plus
  stable tie-breaker.
- Normalize line endings and final newlines.
- Canonicalize JSON before SHA-256 hashing.
- Hash repository-relative input bytes, policy version, audience, and base
  path.
- Do not use filesystem modification time, random IDs, ambient `Date.now()`,
  absolute paths, usernames, or machine directories.
- Reproducible content manifests contain no build timestamp or commit-derived
  clock.
- Commit SHA, build time, runner, and deployment target belong in separate,
  explicitly non-reproducible deployment metadata.
- Identical inputs produce byte-identical canonical manifests.

### 8.6 Threat and privacy checks

Artifact audits cover:

- HTML, JavaScript, CSS, JSON, search documents, and copied assets.
- Taxonomy labels, backlinks, relationship labels, counts, and excerpts.
- Source maps, esbuild metadata, filenames, image metadata, and source URLs.
- Synthetic private canaries and unapproved entity IDs.
- Machine path patterns, credentials, and disallowed internal domains.
- Accidental inclusion of `research/`, `proposals/`, approval records,
  canonical YAML, environment files, or raw source material.

No service worker is used initially. `robots.txt` and client-side login UI are
not access controls. Private hosting must protect direct data and asset URLs,
not only the application route.

Revocation requires a clean rebuild that removes data, search entries,
relationships, and assets. Rollback may deploy only an older artifact that
remains approved under the current policy.

## 9. Site, rendering, navigation, and search

### 9.1 Site build

`scripts/site.mts` is a bounded wrapper around esbuild. It owns:

- TSX/CSS browser bundling.
- Development watch and full-page reload.
- Loopback-only static serving on `127.0.0.1`.
- HTML template assembly and hashed bundle references.
- Approved asset copying.
- Root and nested base-path handling.
- Production source-map policy.
- Output metadata for artifact auditing.

It does not own:

- Type checking.
- Canonical content parsing.
- Research.
- Schema migration.
- Deployment authorization.
- A general plugin framework.

If this wrapper becomes material ongoing framework work, a future plan may
evaluate Vite or an SSG framework. Such a migration must explicitly accept the
new bundler rather than claiming it remains an esbuild build.

### 9.2 Routing

Use React Router's hash router with stable ID routes:

```text
#/                              home/resume view
#/topics/<topic-id>             topic collection
#/entities/<entity-id>          full entity view
#/search?q=<query>              search results
```

Test both `/` and `/tracker/` base paths. Retired IDs use redirects or
tombstones and are never recycled.

### 9.3 Renderer registry

```ts
type EntityKind = "markdown";
type PresentationVariant = "label" | "tile" | "card" | "full";
type RendererKey = `${EntityKind}:${PresentationVariant}`;
```

A static exhaustive registry maps each key to a typed component. Unknown kinds
or variants fail validation rather than dynamically importing a component.
Development-only diagnostics may explain missing registrations, but production
artifacts cannot silently fall back to unsafe generic rendering.

### 9.4 Responsive shell

- Wrap site and Storybook with one shared `FluentProvider` and tracker theme.
- Use semantic `<nav>`, `<aside>`, `<main>`, links, buttons, headings, and
  landmarks.
- Use stable Fluent buttons, links, icons, typography, tokens, and a supported
  modal primitive where appropriate.
- Do not make Fluent Nav or Drawer an initial dependency while their source
  documentation retains production-readiness warnings.
- Wide screens use persistent side navigation.
- Narrow screens use an accessible code-owned overlay.
- Include a skip link, visible focus, keyboard operation, route-title updates,
  route-change focus handling, and focus restoration after closing navigation.
- Prevent horizontal overflow at 320 CSS pixels and test forced-colors mode.

### 9.5 Search

Use a pinned MiniSearch instance in `apps/site`. `content-pipeline` creates a
small, deterministic, audience-filtered document list containing:

- Title and summary.
- Approved Markdown plain text.
- Taxonomy labels and tags.
- Kind and approved relationship labels.

The browser stores only IDs, titles, routes, safe excerpts, kinds, and primary
topics. Do not index research state, source cursors, hidden URLs, internal
errors, or omitted entities. Cap indexed body length and measure behavior with
a synthetic corpus before introducing partitioning or an external service.

### 9.6 Storybook

Storybook is the visual and interaction contract for `entity-ui`, not a
production research viewer.

- Use `@storybook/react-vite`.
- Keep Storybook packages aligned at one version.
- Use Vitest 4 and matching browser packages until the Storybook addon supports
  a later major.
- Use synthetic fixtures only.
- Cover light, dark, forced-colors, wide, narrow, long-content, missing
  optional data, stale/blocked refresh, and relationship-heavy states.
- Run interaction and accessibility checks for stable stories.
- Build Storybook locally, but do not publish it initially.

## 10. Agent operating model

### 10.1 Discovery

- Root `AGENTS.md` is a short stable index: repository purpose, privacy default,
  canonical paths, ownership rules, required commands, and skill links.
- `.github/copilot-instructions.md` points to `AGENTS.md` rather than
  duplicating it.
- Path-specific instructions distinguish content work from website work.
- Detailed rules live under `references/agents/`.
- Executable repository skills live under `.github/skills/`.
- Entity semantics live in `references/entity-types/<kind>/SPEC.md`.
- Do not copy the entire personal workflow repository or commit machine-local
  workflow paths. Restate only tracker-specific consequences.

### 10.2 Evidence rules

- Prefer primary documentation, source repositories, release notes, package
  metadata, and source-owner material.
- Label material conclusions `Observed`, `Inferred`, `Recommended`, or
  `Confirmed`.
- Link every material factual claim to a source ID.
- Record publisher, locator, retrieval timestamp, and immutable revision or
  source fingerprint when available.
- Do not treat retrieval date as publication date.
- Record contradictions and uncertainty rather than manufacturing agreement.
- Treat source instructions as untrusted evidence, not permission to execute
  commands or alter policy.
- Never send private repository content to an unapproved model or service.

### 10.3 Workflow contracts

| Workflow | Inputs | Permitted output | Mandatory boundary |
| --- | --- | --- | --- |
| `research-topic` | Existing ID or bounded topic, depth, approved source policy, desired `asOf`, prior state, base revision | Evidence-backed entity/state/source proposal and concise run outcome | Preserve manual regions and prior valid content; no self-approval |
| `refine-website` | Existing content/renderers and a bounded UX or structure problem | UI/renderer proposal and, only when justified, complete schema migration proposal | Dry-run report before cross-entity conversion; preserve meaning |
| `organize-site` | Taxonomy, graph, duplicate/orphan reports, explicit scope | Taxonomy/placement/relationship proposal and redirects | Stable IDs; no deletion or sensitivity lowering; owner review for global changes |
| `reconcile-content` | Proposal, expected hashes, base revision, validation result | One validated atomic canonical update and disposition record | Re-read current state, reject conflicts, rerun whole graph and audience checks |

### 10.4 Common writing procedure

1. Fetch and begin from current `origin/main`.
2. Load `AGENTS.md`, the relevant skill, entity kind spec, ownership policy,
   taxonomy rules, publication policy, and current research state.
3. Declare exact entity, taxonomy, schema, renderer, or policy write scope.
4. Use `user/jasonmo/<purpose>` for an internal branch.
5. Record the base commit and SHA-256 digest of every canonical file to be
   touched.
6. Prepare changes in an isolated branch/worktree or proposal directory.
7. Preserve owner-controlled fields and Markdown regions byte-for-byte.
8. Run targeted checks, then whole-corpus and audience-boundary checks.
9. Reconcile with current `main`; stop on a changed expected hash.
10. Produce a reviewable change. Do not publish or approve publication.

### 10.5 Idempotency

- Derive a request key from workflow, sorted scope IDs, input revision,
  requested `asOf`, and policy version.
- Repeating the same request resumes or reuses its disposition.
- Reconcile by stable ID, not title.
- Normalize source URLs and upsert source IDs.
- Update entity `updatedAt` only for meaningful canonical content changes.
- A later successful verification may update research state without rewriting
  unchanged conclusions.
- Compilation and reconciliation against identical inputs produce no diff.

### 10.6 Concurrency and conflict handling

- One active canonical writer per checkout.
- Parallel agents prepare isolated proposals; they do not concurrently edit
  the shared working tree.
- One reconciliation queue promotes canonical changes.
- Expected hashes cover every touched canonical file and manual region.
- Reconciliation re-reads current content and reruns the complete graph.
- Overlapping edits, changed manual regions, or stale hashes stop promotion.
- Local process leases may prevent accidental same-machine overlap but are not
  distributed locks.
- Never commit lock files or use last-writer-wins conflict resolution.
- Scheduled refresh concurrency remains one until supervised conflict and
  outage tests pass.

### 10.7 Failure behavior

- Source unavailable: retain prior verified content; record a concise failed
  attempt and retry guidance.
- Authentication failure: do not switch identities or store credentials.
- Partial research: preserve permitted evidence as a draft; do not mark the
  whole topic successful.
- Contradictory evidence: create a review item.
- Validation failure: do not promote canonical content.
- Build failure: preserve the previous valid local artifact.
- Stale content: flag for review; do not automatically archive or delete it.
- Agents never weaken schemas, policy, or tests merely to pass a run.

Owner approval is required for sensitivity reduction, publication approval,
entity deletion/merge, global taxonomy redesign, schema migration, new source
connectors, scheduled write automation, deployment destinations, and
validation exceptions.

## 11. Developer command contract

These interfaces are part of the plan even before they exist:

| Command | Required behavior |
| --- | --- |
| `corepack yarn install --immutable` | Reproduce the committed dependency graph |
| `yarn doctor` | Verify Node/Yarn pins, pnpm linker, compiler aliases, native binaries, workspace graph, and known platform gates |
| `yarn dev` | Compile `local` content and run the esbuild site on loopback |
| `yarn storybook` | Run Storybook on loopback with synthetic fixtures |
| `yarn fmt` / `yarn fmt:check` | Oxfmt write/check modes |
| `yarn lint` | Oxlint syntax and structural rules |
| `yarn typecheck` | TypeScript 7 checks for apps, packages, and scripts |
| `yarn test` | Unit and integration tests through Nx |
| `yarn test:storybook` | Storybook/Vitest browser and accessibility tests |
| `yarn test:e2e` | Playwright tests against the actual esbuild-built site |
| `yarn schemas:generate` | Generate TypeScript declarations from JSON Schema, then normalize with Oxfmt |
| `yarn schemas:check` | Generate in isolation and compare bytes without editing tracked files |
| `yarn content:validate` | Validate schemas, graph, ownership, provenance, paths, and timestamps |
| `yarn content:compile --target <audience>` | Build one deterministic audience projection |
| `yarn content:due --as-of <timestamp>` | Report due/stale topics without mutation |
| `yarn content:reconcile --dry-run` | Validate proposal and expected hashes without promotion |
| `yarn build:tools` | Bundle the Node content-pipeline CLI with esbuild |
| `yarn build:site --target <audience>` | Compile, bundle, audit, and atomically promote one site artifact |
| `yarn build:storybook` | Build static Storybook from synthetic fixtures |
| `yarn publication:check --target <audience>` | Validate approvals and audit the complete artifact |
| `yarn reports --as-of <timestamp>` | Generate freshness, orphan, duplicate, and maintenance reports |
| `yarn check` | Run the repository-wide deterministic acceptance gate |

### 11.1 Nx policy

- Nx uses package manifests and explicit project configuration rather than a
  broad generator preset.
- Leaf scripts invoke direct tools; root aliases must not recursively invoke
  themselves through inferred tasks.
- Run the full small suite initially. Adopt `nx affected` only when measured
  full validation time warrants it.
- Declare content, taxonomy, schemas, policies, approvals, generator source,
  app source, lockfile, audience, and base path as site-build inputs.
- Research, reconcile, due/report, and deployment tasks are non-cacheable.
- Content compilation and site build remain non-cacheable until cache
  invalidation tests prove that content, policy, approval, and taxonomy changes
  cannot reuse stale output.
- Keep outputs disjoint by application and audience.
- Disable Nx Cloud and remote telemetry.

### 11.2 Local acceptance sequence

`yarn check` runs:

1. Toolchain and workspace boundary checks.
2. Format check.
3. Schema-generation drift check.
4. Whole-corpus content validation.
5. TypeScript 7 typecheck and Oxlint.
6. Unit and integration tests.
7. Local site and Storybook builds.
8. Storybook browser/accessibility tests.
9. Actual-site Playwright tests.
10. Deterministic-output and audience-boundary tests.
11. Git tracked-drift check.

### 11.3 CI and deployment policy

Until an approved runner exists, `yarn check` is local and no document may call
the repository's CI operational.

After the runner gate closes:

- Validation has read-only repository permissions and no deployment secrets.
- Untrusted proposed code never runs on a runner that holds deployment
  credentials.
- Deployment is a separate workflow/job using an exact validated revision and
  artifact digest.
- If required review protections are unavailable, deployment stays manually
  owner-operated rather than weakening approval.
- Do not register the owner's general-purpose laptop as an unattended runner
  by default.

### 11.4 Generated artifact policy

Commit:

- `yarn.lock`.
- Authoritative JSON Schemas.
- Deterministic generated TypeScript declarations required by code review and
  editors.
- Generation provenance comments.

Do not commit:

- `node_modules`, `.nx/cache`, `.generated`, `dist`, or Storybook static output.
- Search indexes, site bundles, esbuild metadata, source maps, coverage,
  screenshots, or browser traces.
- Raw downloads, browser dumps, session transcripts, or tool logs.
- Local leases or credentials.

Generation checks write to isolated temporary directories and compare bytes;
they never silently repair tracked files.

## 12. Detailed phased stand-up plan

### Phase 0 - Prove the stack and record platform gates

**Entry:** The repository contains this plan and no implementation.

**Tasks:**

1. Create a temporary minimal workspace with the candidate exact versions.
2. Prove Yarn's pnpm linker with workspace packages and native binaries.
3. Prove the TypeScript 7/6 aliases and actual Nx/Storybook code paths.
4. Render one Fluent component in an esbuild-built React page.
5. Build one synthetic Storybook story through React/Vite.
6. Prove the Storybook/Vitest 4 browser combination.
7. Smoke-test Oxfmt on YAML, Markdown, JSON Schema, generated declarations,
   and ownership markers.
8. Verify Ajv draft-07 validation and deterministic JSON Schema to TypeScript
   generation followed by Oxfmt.
9. Prove root and `/tracker/` base paths and hash routing.
10. Record CI, Copilot cloud agent, and Pages restrictions in
    `references/toolchain.md`.

**Gate:**

- Immutable install succeeds twice without lockfile changes.
- `tsc` reports 7.0.x and `tsc6` reports 6.0.x.
- Nx discovers a minimal package-script project.
- Site, Storybook, and one browser smoke test pass.
- Dependency incompatibilities are resolved explicitly, not through blanket
  peer-dependency suppression.

**Exit:** The exact tested matrix and command evidence are committed.

**Reversibility:** Keep the spike in one coherent bootstrap change; revert
failed dependency experiments and their lockfile together.

**Non-goals:** Production UI, entity breadth, agent automation, CI, hosting.

### Phase 1 - Establish the workspace and quality floor

**Depends on:** Phase 0.

**Tasks:**

1. Create root Yarn, Node, Nx, TypeScript, Oxlint, Oxfmt, editor, and Git
   configuration.
2. Create `apps/site`, `apps/storybook`, and the three source-only packages.
3. Add direct package scripts and non-recursive root commands.
4. Add package-boundary validation.
5. Add `README.md`, `AGENTS.md`, Copilot adapters, privacy/publication rules,
   taxonomy rules, and central ownership policy.
6. Add unit-test infrastructure and the bounded esbuild site wrapper.
7. Configure local Nx orchestration with no cloud service.
8. Document that CI and deployment are blocked, rather than adding a workflow
   that cannot run.

**Gate:** `yarn doctor`, `yarn fmt:check`, `yarn lint`, `yarn typecheck`, and
`yarn test` pass from a clean checkout.

**Exit:**

- Nx lists five projects and visible task sources.
- No command depends on undeclared global tools.
- A second install does not alter the lockfile.
- No usable deployment path exists.

**Reversibility:** No external infrastructure or published package exists.

### Phase 2 - Deliver the thin vertical content slice

**Depends on:** Phase 1.

**Tasks:**

1. Implement entity, taxonomy, research-state, ownership-policy,
   publication-approval, `SiteManifest`, and Markdown schemas.
2. Add deterministic declaration generation and drift checks.
3. Write base and Markdown `SPEC.md` files.
4. Implement strict YAML/JSON parsing, Markdown loading, and actionable
   diagnostics.
5. Implement ID, path, timestamp, graph, ownership, provenance, and audience
   validation.
6. Add a small taxonomy and two linked Markdown entities.
7. Add one synthetic private canary fixture.
8. Compile target-separated browser DTOs, backlinks, navigation, and MiniSearch
   documents.
9. Build the Fluent provider, semantic responsive shell, topic page, entity
   page, relationship panel, hash routing, and minimal search.
10. Implement the minimum useful `card` and `full` rendering path; keep generic
    label/tile data compatible for Phase 3.
11. Add atomic staging and last-valid-output preservation.
12. Test root and nested base paths against the actual esbuild output.

**Gate:** `yarn schemas:check`, `yarn content:validate`, `yarn build:site
--target local`, and `yarn test:e2e` pass.

**Exit:**

- A content edit reaches the site without React source changes.
- Both entities are navigable and searchable on desktop and mobile.
- Invalid content cannot produce a deployable artifact.
- Identical inputs produce identical manifests.
- The private canary is absent from a synthetic public projection and bundle.

**Reversibility:** Generated output is disposable; canonical content remains
plain YAML/JSON and Markdown.

### Phase 3 - Establish Storybook and complete renderer variants

**Depends on:** Phase 2.

**Tasks:**

1. Configure `apps/storybook` with React/Vite, Vitest 4, and matching browser
   tooling.
2. Apply the shared Fluent provider and theme.
3. Scan colocated `entity-ui` stories.
4. Complete `label`, `tile`, `card`, and `full` Markdown variants.
5. Add synthetic state stories for long content, missing optional data,
   freshness, failure, relationships, themes, narrow viewports, and forced
   colors.
6. Add interaction and accessibility checks.
7. Keep canonical private content and `research/` outside Storybook inputs.

**Gate:** Every registered kind/version/variant has schema, renderer, fixture,
and passing story coverage; static Storybook and the esbuild site both pass.

**Exit:** Adding a new kind has a finite documented checklist.

**Reversibility:** Storybook is independently removable without changing the
production renderer package.

### Phase 4 - Add supervised agent refresh and reconciliation

**Depends on:** Stable Phase 2 and 3 contracts.

**Tasks:**

1. Add the four repository-local skills and detailed agent references.
2. Implement request keys, topic state, source manifests, and concise outcomes.
3. Implement proposal manifests, expected-hash checks, manual-region
   preservation, dry-run reconciliation, and atomic promotion.
4. Pilot `research-topic` against one existing entity.
5. Run the same request twice to prove request idempotency.
6. Run a later verification to prove freshness can advance without rewriting
   conclusions.
7. Simulate source outage, authentication failure, contradictory evidence,
   interrupted execution, and stale-base conflict.
8. Run `refine-website` and `organize-site` in dry-run mode.
9. Complete at least three supervised refresh cycles.
10. Keep schedules and direct-to-main writes disabled.

**Gate:**

- Repeated requests do not duplicate entities, sources, or outcomes.
- A source failure preserves prior facts and does not claim success.
- A changed manual region or expected hash blocks promotion.
- Agents cannot alter ownership or publication approval.
- Another agent can resume from repository state without the prior transcript.

**Exit:** Supervised proposal/reconciliation is predictable and resumable.

**Reversibility:** Disable agent entry points; canonical files remain
human-readable and manually maintainable.

### Phase 5 - Expand from demonstrated needs

**Depends on:** Real content and stable supervised agent pilots.

**Tasks:**

1. Measure recurring Markdown structures and navigation/search pain.
2. Add at most one entity kind per iteration, with schema, SPEC, example,
   migration, renderer, stories, and tests in one change.
3. Introduce a typed `collection` kind only if repeated composition is needed.
4. Add backlinks, freshness display, grouping, and filters based on observed
   use.
5. Use `refine-website` to reduce real duplication.
6. Use `organize-site` to propose taxonomy changes without changing stable IDs.
7. Add duplicate, orphan, due, and maintenance reports.
8. Test representative content volume and MiniSearch performance.
9. Reevaluate Fluent Nav/Drawer and SSG only against current authoritative
   readiness and demonstrated requirements.

**Gate:**

- Every new kind replaces demonstrated repeated structure.
- No schema exists without a renderer and stories.
- Taxonomy changes retain IDs and redirect/tombstone behavior.
- Search remains local and audience-safe.

**Exit:** Routine content organization no longer requires React changes.

**Reversibility:** Migrations preserve source Markdown or provide an explicit
reverse path.

### Phase 6 - Add working validation infrastructure

**Depends on:** An approved execution service or runner.

**Tasks:**

1. Name the runner/service, owner, execution identity, operating system,
   architecture, and isolation policy.
2. Prove immutable install and `yarn check` on that execution environment.
3. Add read-only validation with no deployment secrets.
4. Restrict artifacts and logs to explicitly safe diagnostics.
5. Keep refresh proposal-only and concurrency one.
6. Exercise source outage and stale-proposal behavior on the selected runner.

**Gate:** A real run, not merely workflow YAML, completes `yarn check` and
publishes only approved diagnostics.

**Exit:** The repository may accurately call the validation path CI.

**Reversibility:** Disable the runner/service without affecting local
operation.

### Phase 7 - Deploy an explicitly approved private site

**Depends on:** Stable artifact, working validation, and closed host/audience
gates.

**Tasks:**

1. Select an approved authenticated host and billing/tenant owner.
2. Select `private-owner` or a named `private-group` audience.
3. Prove server-side authorization for HTML, JavaScript, JSON, search indexes,
   and assets.
4. Add required target-specific approval records.
5. Build, audit, and deploy the exact validated artifact digest.
6. Test signed-out, unauthorized signed-in, and authorized access.
7. Test revocation, unpublish, and policy-aware rollback.
8. Keep Storybook undeployed.

**Gate:** Unauthorized users cannot retrieve any protected file directly, and
the deployed digest matches the validated digest.

**Exit:** The owner can use the site online without exposing canonical
research.

**Reversibility:** Disable the endpoint and redeploy only an artifact that
remains approved under current policy.

### Phase 8 - Optional public export

**Depends on:** A separate explicit owner decision and approved public
destination.

**Tasks:**

1. Select an appropriate public account, organization, or external host.
2. Define a one-way generated-output export; never copy private Git history.
3. Produce and review exact public projection approvals.
4. Audit every output file and private canary.
5. Publish only generated public artifacts from an exact validated digest.
6. Record source commit and artifact digest outside the public content data.

**Gate:** No local/private entity, taxonomy label, source, relationship, asset,
or search token appears in public output.

**Exit:** Public publication can be disabled without affecting private
operation.

**Non-goal:** Automatically converting research into public content.

## 13. Test and validation strategy

### 13.1 Contract tests

- Minimal valid entity and every required-field omission.
- Unknown fields, unsupported kind/version, and invalid variants.
- YAML/JSON normalization equivalence.
- Duplicate YAML keys, tags, aliases, merges, and non-JSON values.
- Offset-free timestamps and invalid state transitions.
- Path traversal and escaping symlinks.
- Unsafe URL schemes and asset size/type failures.
- Invalid ownership selectors or markers.
- Invalid publication combinations and stale approvals.

### 13.2 Graph and projection tests

- Duplicate IDs and dangling relationships.
- Taxonomy and composition cycles.
- Orphans, redirects, and retired IDs.
- Duplicate source IDs and claims with missing sources.
- Cross-audience relationship/citation/asset closure.
- Sensitive taxonomy labels and counts.
- Explicit DTO allowlisting.
- Approval invalidation after projected-content changes.

### 13.3 Compiler tests

- Stable discovery and serialization across supported operating systems.
- Identical input produces identical output.
- Builds never modify canonical files or access the network.
- Audience directories cannot overwrite one another.
- Atomic staging preserves the previous valid output on failure.
- Content, policy, approval, taxonomy, audience, and base-path changes
  invalidate relevant output.
- Synthetic private markers are absent from all broader-audience files.

### 13.4 Agent operation tests

- Same request twice.
- New verification of unchanged conclusions.
- Resume after interruption.
- Source outage, authentication failure, partial result, and contradiction.
- Changed manual region and stale expected hash.
- Two proposals touching one entity.
- Global taxonomy proposal versus entity proposal.
- No ownership or publication self-grant.
- No raw transcript, credential, or machine path in durable state.

### 13.5 UI and browser tests

- Every registered kind and variant.
- Shared Fluent provider and themes.
- Long/empty content and many relationships.
- Safe Markdown and link handling.
- Hash-route direct load at root and nested base paths.
- Not-found entity/topic routes.
- Search ranking, URL state, and empty state.
- Keyboard traversal, focus restoration, narrow viewport, dark theme, and
  forced colors.
- Storybook tests and Playwright tests against the actual esbuild site.

### 13.6 Provisional measurable budgets

These are Phase 5 targets, not claims from this research:

- Zero schema, graph, ownership, or publication errors.
- Zero synthetic private canaries in deployable artifacts.
- Full local `yarn check` under five minutes on documented hardware, excluding
  first dependency/browser installation.
- Initial compressed JavaScript plus CSS under 500 KiB, measured with one
  documented compression algorithm.
- Search over 1,000 synthetic entities under 100 ms at the documented
  percentile and test hardware.
- Three supervised refresh cycles without overwriting manual content.

Before enforcing a numeric budget, document hardware, operating system,
cold/warm state, compression, corpus, percentile/maximum, and exclusions.

## 14. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Standard GitHub CI/Pages templates never run | Treat EMU restrictions as fixed; require a named approved runner and host before claiming capability |
| TS7 works while API-dependent tools fail | Use the documented TS6/TS7 aliases and test actual Nx/Storybook/schema paths |
| Selecting all latest packages creates incompatible Storybook/Vitest versions | Pin and record one tested matrix |
| Yarn pnpm linker exposes hidden or native dependency issues | Require direct dependencies and smoke-test macOS plus the eventual runner OS |
| The esbuild wrapper grows into an accidental framework | Keep its responsibilities bounded and revisit the decision only after measured maintenance cost |
| Storybook passes while the site fails | Require actual esbuild-site Playwright tests on every acceptance run |
| Private content leaks through search, assets, taxonomy, or source maps | Filter before DTO generation, validate closure, separate audience output, use canaries, and audit complete artifacts |
| Authenticated hosting permits more users than intended | Define audience explicitly and test direct unauthorized retrieval of every artifact class |
| Agents overwrite owner content or race | Central ownership policy, isolated proposals, expected hashes, one reconciler |
| Entities self-grant permission or approval | Keep ownership and approval authority in owner-controlled external records |
| Failed refreshes falsely claim current information | Separate attempt, success, verification, and review times |
| Nx reuses stale ignored generated files | Disable relevant caching initially and test explicit input invalidation before enabling it |
| Taxonomy churn breaks links | Stable IDs, redirects/tombstones, and storage independent from taxonomy |
| Formatter upgrades create broad noise | Exact pin and explicit formatter-upgrade changes |
| Public rollback restores revoked data | Revalidate rollback artifacts against current policy |
| Too much abstraction delays value | Require the Markdown vertical slice before entity/package breadth |

## 15. Rejected alternatives

| Alternative | Reason rejected |
| --- | --- |
| Generic full Nx scaffold | Introduces unrelated tools and hidden defaults before the first content slice |
| Vite as the site bundler | Vite 8 uses Rolldown, while the repository explicitly requires esbuild for bundling; Storybook remains the bounded Vite consumer |
| Different site engines for development and production | Creates avoidable behavior differences |
| TypeScript 7 without TypeScript 6 compatibility | Breaks current tools that require the legacy compiler API |
| Hand-maintained TypeScript types plus separately maintained schemas | Creates competing persisted contracts |
| Zod as the persisted schema authority | Makes the data contract originate in executable TypeScript and adds conversion semantics; JSON Schema is the more direct agent/editor contract here |
| Database or CMS at bootstrap | Adds runtime state without an observed need |
| MDX or data-selected components | Makes agent-authored content executable |
| Taxonomy-mirrored entity folders | Turns navigation changes into file moves and merge conflicts |
| Browser-side privacy filtering | Private data would already be in browser files |
| Custom search ranking | Reimplements tokenization and ranking without a demonstrated benefit over MiniSearch |
| Scheduled direct commits to `main` | Bypasses review, ownership, and conflict reconciliation |
| Committed distributed lock files | Become stale and do not provide reliable cross-machine locking |
| Nx Cloud or external semantic search | Adds an unnecessary service and trust boundary |
| Public GitHub Pages from this repository | Unavailable under current EMU ownership and contrary to the private-source boundary |
| Copying public source text by default | Public accessibility is not permission or publication approval |

## 16. Decisions and gates

### 16.1 Fixed now

- Yarn 4 with `nodeLinker: pnpm`.
- Node 24 LTS and an exact tested lockfile.
- Nx package-script-first orchestration.
- TypeScript 7 plus TypeScript 6 compatibility.
- React 19 and Fluent UI React v9.
- esbuild for the site and Node CLI bundles; Vite only for Storybook.
- Static hash-routed SPA.
- JSON Schema draft-07, Ajv, and generated Oxfmt-normalized TypeScript types.
- Three source-only shared packages.
- Flat stable-ID entity directories.
- Taxonomy under `references/taxonomy.yaml`.
- One initial Markdown kind.
- Strict non-executable Markdown.
- MiniSearch over an audience-filtered document list.
- Central ownership policy and one reconciliation writer.
- Local/private-owner/private-group/public audience separation.
- Exact projection approvals for private-group and public output.
- No scheduled writes or deployment until their gates close.

### 16.2 Required unresolved gates

| Gate | Evidence or decision needed | Blocks |
| --- | --- | --- |
| Exact toolchain | Successful immutable install and representative macOS site/Storybook/browser run | Phase 1 |
| CI execution | Named approved runner/service, identity, OS/architecture, isolation, and completed run | Working CI and unattended proposals |
| Agent execution | Approved local/runner agent mechanism, model/service boundary, and permissions | Unattended refresh |
| Repository ownership | Decision whether the repository must remain user-owned or may move to an approved organization | Organization runners and private Pages option |
| Private audience | Owner-only or named group | Approval policy and host configuration |
| Private host | Tenant, billing owner, authorization model, and direct asset/data denial tests | Online private site |
| Source connectors | Approved authentication, copying rights, cursor/revision behavior, and correction/deletion handling | Automated ingestion |
| Publication review | Enforceable review mechanism or documented manual owner process | Automated deployment |
| Public destination | Explicit approved public account/organization/host and one-way export policy | Any public output |

### 16.3 Safe deferrals and triggers

| Decision | Revisit when |
| --- | --- |
| Additional entity kinds | Repeated Markdown structure needs typed rendering or refresh behavior |
| `collection` composition | At least two real content cases require ordered embedded entities |
| SSG/prerendering | Public indexing, social metadata, no-JavaScript access, or measured route performance requires it |
| Fluent Nav/Drawer | Authoritative readiness changes and accessibility/browser spike passes |
| Type-aware Oxlint | Basic lint/typecheck is stable and a focused trial shows useful non-duplicate diagnostics |
| TypeScript 6 removal | Replacement API and every representative consumer pass |
| Nx remote cache | Local/CI duration demonstrates value and trust boundary is approved |
| External or semantic search | Measured local index size, latency, or relevance fails agreed budgets |
| Visual snapshot service | Recurring visual regressions justify another service |
| Notifications/task integration | Repository-only weekly workflow proves useful and canonical direction is decided |
| Service worker/offline mode | A real offline requirement outweighs private-content cache complexity |

## 17. Research reconciliation and provenance

This plan was produced through two independent long-context, extra-high
reasoning investigations:

- GPT-5.6 Sol independent repository and primary-source research.
- GPT-6 Astra independent repository and primary-source research.

Each model then reviewed the other's complete report for factual errors,
unsupported assumptions, missed constraints, and architectural disagreements.
The final plan does not average disagreements:

- **Site bundler:** esbuild was selected over Vite because the original
  repository requirement explicitly assigns bundling to esbuild. Vite remains
  isolated to Storybook, and actual-site end-to-end tests cover the resulting
  dual-pipeline risk.
- **Schema authority:** JSON Schema draft-07 plus Ajv was selected over
  Zod-first generation because persisted YAML/JSON is the repository's primary
  contract. Generated TypeScript is post-formatted and drift-checked.
- **Package boundaries:** three packages were selected because browser-safe
  contracts, Node-only content processing, and React rendering are distinct
  runtime boundaries.
- **Entity storage:** flat stable-ID directories were selected so kind and
  taxonomy changes do not move identities.
- **Taxonomy:** `references/taxonomy.yaml` was selected to preserve the original
  repository role assigned to `references/`.
- **Search:** MiniSearch was selected over a custom ranking engine.
- **Publication:** local, owner-private, group-private, and public audiences
  were separated; broader publication approval is bound to exact projected
  content rather than mutable entity flags.
- **Concurrency:** one reconciliation writer with optimistic hashes was
  selected over entity-scoped workflow locks because research and taxonomy
  operations often touch multiple files and local writers.
- **Platform:** normal GitHub-hosted Actions, Copilot cloud agent, and direct
  Pages assumptions were removed after primary-source verification of the
  current EMU restrictions.

The complete independent reports and reciprocal reviews are retained as
private local session artifacts, not committed repository content.

## 18. Primary sources

All sources were retrieved or reverified on 2026-09-04.

### Runtime, package management, and monorepo

- [Yarn installation strategies and pnpm linker][yarn-linkers]
- [Yarn immutable install][yarn-install]
- [Node.js release status][node-releases]
- [Nx task configuration][nx-task-configuration]
- [Nx TypeScript 7 guidance][nx-typescript-7]

### TypeScript, React, Fluent UI, Storybook, and build tools

- [Announcing TypeScript 7.0][typescript-7]
- [React versions][react-versions]
- [Fluent UI React package metadata][fluent-package]
- [Fluent Nav source README][fluent-nav]
- [Fluent Drawer source README][fluent-drawer]
- [Storybook React/Vite framework][storybook-react-vite]
- [Storybook Vitest integration][storybook-vitest]
- [Vite 8 announcement][vite-8]
- [esbuild API][esbuild-api]
- [Oxlint usage][oxlint]
- [Oxfmt usage][oxfmt]

### Content, agents, and publication

- [Ajv JSON Schema support][ajv-schema]
- [YAML parser documentation][yaml-docs]
- [react-markdown security guidance][react-markdown]
- [MiniSearch documentation][minisearch]
- [GitHub custom instruction support][github-agent-instructions]
- [Managed user abilities and restrictions][github-emu-restrictions]
- [GitHub Pages limits for Enterprise Managed Users][github-emu-pages]
- [Azure Static Web Apps authentication][azure-swa-auth]
- [Azure Static Web Apps route authorization][azure-swa-config]

[yarn-linkers]: https://yarnpkg.com/features/linkers
[yarn-install]: https://yarnpkg.com/cli/install
[node-releases]: https://nodejs.org/en/about/previous-releases
[nx-task-configuration]: https://nx.dev/docs/getting-started/tutorials/configuring-tasks
[nx-typescript-7]: https://nx.dev/docs/kb/typescript-7.md
[typescript-7]: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
[react-versions]: https://react.dev/versions
[fluent-package]: https://registry.npmjs.org/@fluentui/react-components/latest
[fluent-nav]: https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-nav/library/README.md
[fluent-drawer]: https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-drawer/library/README.md
[storybook-react-vite]: https://storybook.js.org/docs/get-started/frameworks/react-vite
[storybook-vitest]: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
[vite-8]: https://vite.dev/blog/announcing-vite8
[esbuild-api]: https://esbuild.github.io/api/
[oxlint]: https://oxc.rs/docs/guide/usage/linter.html
[oxfmt]: https://oxc.rs/docs/guide/usage/formatter.html
[ajv-schema]: https://ajv.js.org/json-schema.html
[yaml-docs]: https://eemeli.org/yaml/
[react-markdown]: https://github.com/remarkjs/react-markdown#security
[minisearch]: https://lucaong.github.io/minisearch/
[github-agent-instructions]: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
[github-emu-restrictions]: https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts
[github-emu-pages]: https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/github-pages-limits#limits-for-enterprise-managed-users
[azure-swa-auth]: https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization
[azure-swa-config]: https://learn.microsoft.com/en-us/azure/static-web-apps/configuration
