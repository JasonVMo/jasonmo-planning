# Tracker

A private, local-first personal tracker and static React website for trips,
events, projects, and other future plans. Canonical YAML/JSON and Markdown are
validated and projected into audience-safe browser data. Persisted **data
types** and reusable **view types** are independent: compiler adapters connect
content to common views, while date-based entities also support event,
calendar, and timeline presentations.

The repository foundation is complete. [NEXT.md](NEXT.md) is the active,
phased roadmap for the real information architecture and initial trip/event
content. Durable engineering decisions live in
[references/architecture.md](references/architecture.md).

## Start locally

Use Node 24 (the installed baseline is pinned in `.node-version`) and Corepack.
No global Nx, Storybook, or TypeScript installation is needed.

```sh
corepack yarn install --immutable
corepack yarn doctor
corepack yarn dev
```

Open `http://127.0.0.1:4173/`. The server binds only to loopback and serves built
artifacts, never the repository root. Content and source changes rebuild the
site; an invalid change keeps the last valid preview and reports the error.

```sh
corepack yarn storybook
```

Storybook opens at `http://127.0.0.1:6006/` and uses synthetic fixtures only.
It uses Vite; the actual website uses esbuild in both development and
production.

## Work with content

Each entity lives in `content/entities/<stable-id>/` with one descriptor and
its Markdown body. Start with the included examples, the
[data specification](references/entity-data-types/markdown/SPEC.md), and the
[view specifications](references/entity-view-types/card/SPEC.md).

```sh
corepack yarn content:validate
corepack yarn content:compile --target local
corepack yarn content:due --as-of 2026-09-07T10:15:06-07:00
corepack yarn reports --as-of 2026-09-07T10:15:06-07:00
```

IDs remain stable through taxonomy and view changes. View selection never
changes the stored data schema. Explicit view overrides must be compatible
with both the target entity and render context; invalid overrides are errors.

Agents start from [AGENTS.md](AGENTS.md) and the repository skills under
`.github/skills/`. Research is supervised and proposal-based. Compilation never
accesses external sources or invokes a model.

## Embed Markdown

Markdown is supported both as canonical entity files and as application
embeds. Use the shared `SafeMarkdown` renderer for Markdown strings:

```tsx
import { SafeMarkdown } from "@planning/entity-ui";
import guide from "./guide.md?raw";

export function Help() {
  return (
    <>
      <SafeMarkdown>{guide}</SafeMarkdown>
      <SafeMarkdown>{"## From a string\n\nSome **formatted** text."}</SafeMarkdown>
    </>
  );
}
```

Use `?raw` for portable file imports across the esbuild site and Vite
Storybook. Markdown text is embedded in the JavaScript bundle, not fetched
from a source file at runtime. Local development rebuilds when a Markdown
file changes; built previews contain the same content. Open **Markdown guide**
in site navigation for live file/string examples.

Tables, task lists, strikethrough, lists, quotes, links, and code blocks are
supported consistently by the compiler and browser renderer. HTML and
MDX/JSX execution, images, unsafe URLs, and relative file links remain disabled.

**Keep private content in the content pipeline.** Application `.md` imports
and string literals are shipped in every audience's bundle. Do not import
canonical `content/`, `research/`, `references/`, or `proposals/` files into
browser code. Entity `bodyPath` files continue through validation, ownership
checks, and audience filtering, becoming Markdown strings in the built manifest.

## Calendar and event views

Open **Calendar** in the site navigation for a month-at-a-glance grid, a
full-page day agenda, and a compact, keyboard-navigable timeline. Select a day
or event to drill in; previous/next, Today, date entry, and time-zone controls
keep the selection in the URL.

Author date-based content with the opt-in
[event data contract](references/entity-data-types/event/SPEC.md). It supports
events, appointments, deadlines, and reminders; confirmed, tentative, and
cancelled status; locations; all-day date ranges; and timed intervals with an
explicit IANA time zone. End dates/times are exclusive. A one-day all-day
event uses the following day as its end.

Include `event` in the entity's `view.permittedTypes` to appear in the site's
calendar. Existing Markdown entities are unchanged and are not automatically
converted from their research timestamps. New content defaults to private/local
unless the owner explicitly authorizes a public-safe projection.

The reusable [month](references/entity-view-types/calendar-month/SPEC.md),
[day](references/entity-view-types/calendar-day/SPEC.md),
[timeline](references/entity-view-types/timeline/SPEC.md), and
[event](references/entity-view-types/event/SPEC.md) renderers consume typed
browser presentations, independently of persisted data types. Storybook
includes synthetic appointments, all-day/multi-day items, overlaps, empty
days, cancellation, and narrow/dark layouts. Recurrence, calendar import/sync,
notifications, and browser editing are not included.

## Build and quality commands

```sh
corepack yarn playwright install chromium
corepack yarn check
corepack yarn build
corepack yarn build:site --base-path /jasonmo-planning/
corepack yarn preview --base-path /jasonmo-planning/ --port 4173
```

`yarn build` creates the packaged, minified public site in `docs/` with
the `/jasonmo-planning/` base path used by this repository's GitHub Pages project site.
The generated `docs/` artifact is intentionally tracked; Storybook remains a
separate build and is never copied into the Pages source.

The Chromium install is a one-time browser prerequisite, not a production
dependency. `yarn check` covers the complete small repository: schema drift,
canonical content, TypeScript 7, Oxlint, tests, site/Storybook builds, browser
behavior, and publication boundaries. API-dependent tooling uses the documented
TypeScript 6 shim; it does not replace TS7 checking.

| Command                                        | Purpose                                                      |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `yarn fmt` / `yarn fmt:check`                  | Format or check source and content with Oxfmt                |
| `yarn lint`                                    | Oxlint plus runtime package-boundary checks                  |
| `yarn typecheck`                               | TypeScript 7 across all source                               |
| `yarn test` / `yarn test:unit`                 | Nx package tests / direct unit runner                        |
| `yarn schemas:generate` / `yarn schemas:check` | Generate or compare schema-derived types                     |
| `yarn test:storybook`                          | Synthetic browser stories and accessibility                  |
| `yarn test:e2e`                                | Production Chromium behavior at `/` and `/jasonmo-planning/` |
| `yarn build` / `yarn build:pages`              | Minified approved public Pages site in `docs/`               |
| `yarn build:site`                              | Local-only site artifact in `dist/local/`                    |
| `yarn build:tools` / `yarn build:storybook`    | Explicit CLI and synthetic Storybook builds                  |
| `yarn publication:check:pages`                 | Audit the approved public `docs/` artifact                   |

The Pages workflow rebuilds and audits `docs/`, verifies that the committed
artifact has no drift, and deploys it after changes reach `main`. Public content
must be explicitly eligible, non-personal, requested for the public target, and
covered by the exact owner approval. `dist/local/` remains non-deployable.

Canonical facts remain deliberately evidence-backed. Supervised real-source
refresh cycles remain an operating gate; fixture scenarios do not claim that
research occurred. Validated trip banners may use entity-local, source-attributed
public-domain or CC0 JPEGs. Markdown and all other image surfaces remain
disabled.

## Repository map

| Location                    | Responsibility                                                      |
| --------------------------- | ------------------------------------------------------------------- |
| `apps/site`                 | Hash-routed React/Fluent site and local MiniSearch                  |
| `apps/storybook`            | Synthetic renderer stories and browser configuration                |
| `packages/entity-model`     | JSON Schemas, generated types, browser-safe constants               |
| `packages/content-pipeline` | Node-only loading, validation, adapters, projection, reconciliation |
| `packages/entity-ui`        | View-type-only React renderer registry                              |
| `content`                   | Canonical descriptors and Markdown                                  |
| `references`                | Taxonomy, contracts, ownership, publication, and agent rules        |
| `research`                  | Curated continuation state and outcomes, never a browser input      |
| `scripts`                   | Build, serve, generation, and artifact controls                     |

## Publication and infrastructure gates

The repository includes pull-request validation and a public GitHub Pages
workflow. The Pages job has deployment permissions; validation jobs remain
read-only. The public artifact is limited to exact approval-bound content and
must not contain private itinerary details.

No unattended research, repository transfer, deployment credentials, remote
cache, analytics, or public Storybook is configured.
See [NEXT.md](NEXT.md) for current delivery phases,
[references/architecture.md](references/architecture.md) for durable
constraints, and [references/toolchain.md](references/toolchain.md) for the
installed baseline.
