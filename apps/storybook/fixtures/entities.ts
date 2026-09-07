import type { SiteEntity } from "@planning/entity-model";

const standardView = {
  defaultType: "full",
  byContext: {
    navigation: "label",
    collection: "card",
    relationship: "tile",
    search: "label",
    detail: "full",
  },
} as const;

export const markdownEntity = {
  id: "synthetic-agent-systems",
  dataType: "markdown",
  dataVersion: 1,
  title: "Designing reliable agent systems",
  summary:
    "A synthetic research entry about bounded automation, durable evidence, and careful reconciliation.",
  route: "#/entities/synthetic-agent-systems",
  primaryTopicId: "synthetic-engineering",
  tags: ["agents", "reliability", "evidence"],
  relationships: [
    {
      kind: "related-to",
      targetId: "synthetic-release-signal",
      viewType: "tile",
    },
  ],
  citations: [
    {
      title: "Synthetic primary documentation",
      url: "https://example.com/research/agents",
    },
  ],
  lastVerifiedAt: "2026-09-04T16:17:19-07:00",
  view: standardView,
  viewModels: {
    label: {
      title: "Designing reliable agent systems",
      href: "#/entities/synthetic-agent-systems",
    },
    tile: {
      title: "Designing reliable agent systems",
      summary: "Bounded automation with evidence and reconciliation.",
      href: "#/entities/synthetic-agent-systems",
    },
    card: {
      title: "Designing reliable agent systems",
      summary:
        "A synthetic research entry about bounded automation, durable evidence, and careful reconciliation.",
      href: "#/entities/synthetic-agent-systems",
      badges: ["agents", "verified", "markdown"],
    },
    full: {
      title: "Designing reliable agent systems",
      summary:
        "A synthetic research entry about bounded automation, durable evidence, and careful reconciliation.",
      href: "#/entities/synthetic-agent-systems",
      body: `## Research direction

Reliable systems separate **evidence**, decisions, and execution.

- Keep inputs bounded.
- Preserve the last valid result.
- Require explicit approval for broader publication.

> A failed refresh should never masquerade as a successful verification.

Read the [synthetic source](https://example.com/research/agents).`,
    },
  },
} satisfies SiteEntity;

export const syntheticStatusEntity = {
  id: "synthetic-release-signal",
  dataType: "synthetic-status",
  dataVersion: 1,
  title: "Release signal: review required",
  summary:
    "A synthetic non-production data type adapted to the same common label, tile, and card views.",
  route: "#/entities/synthetic-release-signal",
  primaryTopicId: "synthetic-engineering",
  tags: ["status", "review"],
  relationships: [],
  citations: [],
  view: {
    ...standardView,
    defaultType: "card",
  },
  viewModels: {
    label: {
      title: "Release signal: review required",
      href: "#/entities/synthetic-release-signal",
    },
    tile: {
      title: "Release signal: review required",
      summary: "The synthetic signal is blocked pending owner review.",
      href: "#/entities/synthetic-release-signal",
    },
    card: {
      title: "Release signal: review required",
      summary: "A synthetic non-production data type adapted to the same common card renderer.",
      href: "#/entities/synthetic-release-signal",
      badges: ["blocked", "owner review"],
    },
  },
} satisfies SiteEntity;

export const longEntity = {
  ...markdownEntity,
  id: "synthetic-long-form",
  title:
    "A deliberately long research title that verifies wrapping without overflowing a narrow presentation",
  route: "#/entities/synthetic-long-form",
  viewModels: {
    label: {
      title:
        "A deliberately long research title that verifies wrapping without overflowing a narrow presentation",
      href: "#/entities/synthetic-long-form",
    },
    tile: {
      title:
        "A deliberately long research title that verifies wrapping without overflowing a narrow presentation",
      summary:
        "A long summary demonstrates that dense research prose remains readable, wraps naturally, and never pushes the view beyond the available inline size.",
      href: "#/entities/synthetic-long-form",
    },
    card: {
      title:
        "A deliberately long research title that verifies wrapping without overflowing a narrow presentation",
      summary:
        "A long summary demonstrates that dense research prose remains readable, wraps naturally, and never pushes the view beyond the available inline size.",
      href: "#/entities/synthetic-long-form",
      badges: ["long-content", "responsive", "accessibility", "synthetic"],
    },
    full: {
      title:
        "A deliberately long research title that verifies wrapping without overflowing a narrow presentation",
      summary:
        "This entirely synthetic article exercises headings, tables, code, block quotations, links, and enough paragraphs to expose spacing or overflow problems.",
      href: "#/entities/synthetic-long-form",
      body: `## A long section heading that still fits

Research records often contain qualified statements. The layout needs to preserve a comfortable measure while allowing long identifiers such as \`synthetic-reconciliation-request-2026-09-07\` to remain inspectable.

| State | Meaning |
| --- | --- |
| Observed | Directly verified |
| Inferred | Drawn from evidence |
| Confirmed | Supplied by the owner |

\`\`\`text
validation -> projection -> rendering -> review
\`\`\`

### Continuation

Another paragraph ensures the full view has a realistic reading rhythm. [Relative navigation](#/entities/synthetic-agent-systems) remains inside the application.`,
    },
  },
} satisfies SiteEntity;
