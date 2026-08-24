# jasonmo-planning

A TypeScript monorepo for agent-assisted research and a GitHub Pages planning site.

## Development

This repository requires Node.js 22 or newer and Yarn 4 (managed through Corepack).

```sh
corepack enable
yarn install
yarn build
yarn lint
yarn test
yarn bundle
```

Run `yarn dev` for a local development server. The production bundle is written to `site/dist`.

Topic packages are named `packages/topic-<name>`. Each exports a `TopicDefinition` containing its
header, root page, and optional nested pages. The site's `prebuild` task discovers these packages and
generates its topic registry.
