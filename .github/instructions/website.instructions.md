---
applyTo: "apps/**,packages/entity-ui/**"
---

Read AGENTS.md and the relevant view specification. Render browser-safe view
models, not canonical payloads. Dispatch by view type, never by data type.
Share FluentProvider and accessible primitives. Storybook fixtures are
synthetic. Both Storybook and actual esbuild-site browser tests matter because
they use different bundlers.
