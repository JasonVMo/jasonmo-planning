# Canonical content

Each stable entity lives in `entities/<id>/`, with exactly one JSON/YAML
descriptor and a non-executable Markdown body. Taxonomy placement never moves
the directory. Read the [base contract](../references/entity-data-types/base/SPEC.md)
before authoring. Central ownership is mandatory; preserve manual text and
marker lines byte-for-byte. Generated browser data is not canonical.

Entity titles and summaries belong in the descriptor and are rendered by the
selected view. Do not repeat them as the first heading and paragraph of
`body.md`; begin the body with additional detail.

The two initial entities are owner-oriented architecture notes retained for
local continuity. The public tracker uses explicit public-eligible trip,
research, reservation, flight, and event entities; restricted booking details
remain under `research/intake/` and never enter browser projections.
