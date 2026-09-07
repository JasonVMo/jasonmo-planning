# Taxonomy rules

`taxonomy.yaml` is the owner-controlled taxonomy. IDs are global lowercase kebab
case, immutable, and not recycled. Entity IDs and taxonomy IDs cannot collide.
Each entity has one primary topic; related topics and tags are distinct.

Parents must exist. Cycles and duplicate sibling slugs fail validation.
`retiredIds` and `retiredSlugs` reserve old identities; the initial site treats
them as tombstones (not automatic redirects). Do not claim redirects without a
browser route implementation.

Audience filtering removes sensitive topic metadata before navigation/search.
Visible topics require visible ancestors and visible entities require a visible
primary topic. Empty unused branches are omitted without leaking their counts.

Global restructuring is owner-only. Organization proposals may be prepared as
normal files for review, but automated reconciliation cannot change taxonomy,
delete entities, or lower sensitivity.
