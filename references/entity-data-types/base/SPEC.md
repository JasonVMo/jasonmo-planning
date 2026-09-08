# Base entity contract, version 1

Authority: `packages/entity-model/schemas/contracts.schema.json`, definition
`Entity`; named schema files are local entry points. Draft-07 is the persisted
source of truth. Generated declarations must not be hand-edited.

Storage is `content/entities/<id>/` with exactly one `entity.yaml`, `entity.yml`,
or `entity.json`. JSON and YAML 1.2 share strict schema semantics: unknown
fields, duplicate keys, tags, aliases, anchors, merges, non-string keys,
non-finite values, traversal, and symlinks fail. Files are bounded to 256 KiB;
the corpus reader caps reads at 10,000. All timestamps require explicit offsets.

Titles (240 characters) and summaries (2,000) are plain text. Stable IDs are
global lowercase kebab case. Lifecycle is independent of sensitivity,
publication eligibility, freshness, and operational status.

Sources need stable IDs, publisher, permitted locator or HTTP(S) URL, access
classification, retrieval timestamp, and optional revision/fingerprint.
Every material structured claim references existing source IDs and identifies
its observed/inferred/recommended/confirmed basis. Empty source/claim lists
are permitted for initial unverified design notes, not manufactured evidence.

The closed view selection block lists permitted views and optional defaults
and context overrides. Explicit occurrence, context, and entity selections
must be registered, permitted, context-compatible, and adapted. Explicit
invalid choices fail; only site defaults can fall through to the registered
data-type fallback.

Registered data types may supply implicit context defaults before the generic
site defaults. Event, trip, flight, and reservation data use this for collection/detail; explicit selection
precedence and compatibility requirements are unchanged. The Calendar route
adds a reachable event presentation only for compatible entities that permit it.

An explicit `defaultType` is independently checked for registration, entity
permission, and an available adapter even if every context overrides it. A
fully overridden default cannot bypass validation or expose a forbidden body.

An entity references central ownership and research state. It never grants
write permission or publication approval. General typed relationships may
cycle; dangling IDs and duplicate edges fail. Bounded trip composition is
validated separately: targets must exist, child order is unique, cycles are
forbidden, and each segment has one parent leading to exactly one trip root.
General collection payloads remain unsupported and cannot name executable components.

Adding a production data type requires schema, data version, SPEC, migration
decision, projection semantics, registered adapter, and fixtures. It does not
require a new renderer.

The opt-in `event`, `trip`, `flight`, and `reservation` data contracts retain
schema/data version 1 alongside unchanged `markdown` entities. All types
require a confined Markdown `data.bodyPath`; their other payload fields cannot
be mixed. See the [trip](../trip/SPEC.md), [flight](../flight/SPEC.md),
[reservation](../reservation/SPEC.md), and
[event contract](../event/SPEC.md) for date-only and timed interval validation,
private/local defaults, and the deliberate no-conversion migration decision.
