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

An explicit `defaultType` is independently checked for registration, entity
permission, and an available adapter even if every context overrides it. A
fully overridden default cannot bypass validation or expose a forbidden body.

An entity references central ownership and research state. It never grants
write permission or publication approval. General typed relationships may
cycle; dangling IDs and duplicate edges fail. Composition is not implemented:
unknown collection payloads fail rather than being executed.

Adding a production data type requires schema, data version, SPEC, migration
decision, projection semantics, registered adapter, and fixtures. It does not
require a new renderer.
