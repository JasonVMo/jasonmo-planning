---
name: reconcile-content
description: Validate and deliberately promote a bounded content proposal.
---

# Reconcile content

## Inputs

Proposal manifest, expected canonical hashes/base revision, request ID, and
central ownership policy.

## Procedure

1. Read AGENTS.md and `references/agents/reconciliation.md` for the executable
   proposal format and allowed operations.
2. Use a clean isolated checkout for candidate validation. Never stage or
   overwrite unrelated edits.
3. Run `yarn content:reconcile --proposal <manifest> --dry-run`.
4. Reject changed expected hashes, altered manual sections, path escapes,
   publication approval writes, or sensitivity reduction.
5. Validate the complete candidate corpus, not only touched files.
6. Only after explicit approval run the same command with `--apply`.
7. Confirm the disposition, repeat the same request to prove no duplicate
   promotion, and run `yarn check`.

## Outputs and side effects

Dry-run is the default and changes no canonical files. Explicit apply promotes
only authorized validated changes and records a resumable outcome.

## Failure

Keep canonical files intact, surface the exact conflict, and reload current
state. Never force stale proposals or broaden policy to make them pass.

## Example

Validate a proposal that updates one managed Markdown summary and rejects a
concurrent owner edit.
