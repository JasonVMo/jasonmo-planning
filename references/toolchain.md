# Toolchain and platform baseline

Observed 2026-09-07. The lockfile, not floating package metadata, defines the
installed graph.

| Tool                         | Selected                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| Node                         | 24.18.0, the existing machine's Node 24 LTS runtime         |
| Yarn / linker                | 4.18.0 / pnpm                                               |
| Nx                           | 23.2.0, five package-script projects                        |
| TypeScript checker           | 7.0.2 under the `@typescript/native` alias                  |
| TypeScript API compatibility | `@typescript/typescript6` 6.0.2, resolving legacy API 6.0.3 |
| React / React DOM            | 19.2.8                                                      |
| Fluent UI React v9           | 9.74.7                                                      |
| esbuild                      | 0.28.2                                                      |
| Oxlint / Oxfmt               | 1.81.0 / 0.66.0                                             |
| Storybook / Vite             | 10.6.0 / 8.2.2                                              |
| Vitest                       | 4.1.11, compatible with the Storybook addon                 |
| Playwright                   | 1.63.0, Chromium installed separately                       |
| Ajv / YAML                   | 8.20.0 / 2.9.0                                              |
| MiniSearch / React Router    | 7.2.0 / 8.3.1                                               |

## Deliberate differences from candidate versions

The plan's Node 24.20.0 was a candidate. Stand-up uses the existing 24.18.0
runtime instead of modifying a shared machine's global tools. It satisfies the
selected package engine requirements. Future Node patches require an explicit
`.node-version` change and representative checks.

Yarn reports that its optional legacy TypeScript compatibility patch does not
apply to the API alias package. The actual `tsc`, `tsc6`, Nx project discovery,
and schema generation paths must be exercised rather than relying on that
optional patch. Do not switch the requested linker to hide a warning.

Native dependency build scripts may be disabled by machine policy. esbuild,
Nx, TypeScript, and Oxc use their installed platform packages; do not globally
enable dependency scripts merely to remove an install message.

Exact-version Yarn package extensions supply Fluent's omitted `scheduler`
dependency, forward React through Storybook and its Vitest addon, and provide
Vite directly to Vitest's mocker. These repair concrete published metadata
gaps under the pnpm linker; they do not
suppress arbitrary peer warnings. Reevaluate them when upgrading those packages.

`yarn doctor` executes the installed tools and confirms five projects.
`yarn check` is the local acceptance command. No hosted runner or deployment
environment is configured.

## Local stand-up measurements

Measured on 2026-09-07 with macOS 26.6.2, arm64 hardware model Mac17,6, and
the Node/runtime matrix above. These are local warm-cache observations, not
cross-machine service guarantees.

| Measurement                    | Result       | Scope and exclusions                                                                                                                      |
| ------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Complete `yarn check`          | 35.3 seconds | Installed dependencies/browser and warm tool caches; Nx test/build caching disabled; initial install excluded                             |
| Production JavaScript plus CSS | 210.06 KiB   | Sum of gzip level-9 sizes of every emitted JS/CSS file; manifest and development-only reload script excluded                              |
| Search warm p95                | 1.37 ms      | Actual site search functions, 1,000 synthetic documents, 100 queries, nearest-rank p95; index construction and browser rendering excluded |

The search corpus and 100 ms p95 guard live in `scripts/search.test.ts`. The
corpus uses 20 subject tags, short titles/summaries, and repeated plain-text
bodies. Production browser coverage runs at both `/` and `/tracker/`; build
fixtures additionally compare output bytes and preserve prior output after a
canonical validation failure.

Storybook's synthetic preview and axe chunks produce its standard large-chunk
warning; they are not shipped in the production site. Fluent's upstream
Keyborg disposal warning appeared in two dark-theme story cases without
behavioral or accessibility failures.

## Platform gates

This user-owned Enterprise Managed User repository cannot use GitHub-hosted
Actions, Copilot cloud agent, or direct Pages. Selecting an approved runner,
host, audience, and source connector is owner-controlled work, not a bootstrap
side effect.

See the dated primary sources and the unresolved gates in `PLAN.md`. Public
export, unattended research, real-source supervised cycles, and online access
are not claimed by local fixture tests.
