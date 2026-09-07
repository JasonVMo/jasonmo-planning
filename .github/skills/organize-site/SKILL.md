---
name: organize-site
description: Propose taxonomy and relationship changes while preserving stable identities.
---

# Organize site

## Inputs

Taxonomy, entity graph, existing due/orphan/duplicate reports, and a bounded
organization objective.

## Procedure

1. Read AGENTS.md, taxonomy rules, ownership, and publication policy.
2. Run `yarn content:validate` and `yarn reports --as-of <timestamp>`.
3. Propose placement and relationship changes with a before/after explanation.
4. Keep stable IDs and storage directories unchanged. Do not delete or merge
   entities automatically; record duplicate candidates for owner review.
5. Validate cycle freedom, target closure, and audience-safe ancestor labels.
6. Preserve compatible occurrence-specific view selections.
7. Request owner review for global taxonomy, merges, retired IDs, or redirects.
   One reconciliation writer promotes the approved change.

## Outputs and side effects

An isolated taxonomy/relationship proposal and concise rationale, never
automatic deletion or publication.

## Failure

Stop on stale hashes, dangling references, cycles, or sensitivity changes.
Do not resolve conflicting organization changes by last-writer-wins.

## Example

Move a topic under a more useful parent while preserving its ID and every
entity route.
