---
name: refine-website
description: Improve common entity views without coupling them to persisted data types.
---

# Refine website

## Inputs

A bounded UI problem, affected view types, synthetic examples, and desired
user-visible outcome.

## Procedure

1. Read AGENTS.md, relevant view specs, and compatible adapter contracts.
2. Reproduce the problem in a synthetic story and the actual site.
3. Prefer extending an existing common view. A new persisted data type is not
   required for a new visual design.
4. When structured fields are genuinely missing, propose a separate data
   schema/adapter change with migration notes rather than passing arbitrary
   props from content.
5. Keep meaning, provenance, ownership, and publication unchanged.
6. Cover light/dark, narrow screens, keyboard focus, and accessibility.
7. Run targeted stories and actual-site tests, then `yarn check`.

## Outputs and side effects

A view/adapter change with synthetic stories and updated specs. Cross-entity
content conversions begin as a dry-run proposal requiring owner review.

## Failure

Preserve the last valid renderer and surface incompatible data/view pairs.
Never silently substitute an unrelated view for an explicit override.

## Example

Improve summary card readability for Markdown and a synthetic second data type
using the same `card` renderer.
