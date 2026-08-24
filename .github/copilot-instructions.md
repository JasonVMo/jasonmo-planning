# Repository instructions

- Use Yarn 4 and Nx tasks; do not introduce npm or pnpm lockfiles.
- Keep source under each package's `src` directory and use ECMAScript modules.
- Extend `tsconfig.base.json`; TypeScript is type-check only and production bundles use esbuild.
- Use Fluent UI v9 components for site UI.
- Use the Node.js test runner, oxlint, and oxfmt.
- Add content as a `packages/topic-<name>` workspace exporting a `TopicDefinition`.
- Keep downloaded topic assets within that topic package and record their sources in its content.
- Run `yarn build`, `yarn lint`, `yarn test`, and `yarn bundle` before submitting changes.
