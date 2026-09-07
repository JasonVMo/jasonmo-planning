# Independent data and view architecture

This owner-maintained design note separates persisted semantics from reusable
visual contracts. Return to [the tracker overview](#/entities/tracker-overview)
for the intended research workflow.

## Three boundaries

1. **Entity model:** strict JSON Schema draft-07 contracts and generated
   TypeScript types; no React or filesystem dependencies.
2. **Content pipeline:** Node-only parsing, complete-graph validation,
   audience projection, view resolution, adapters, and search documents.
3. **Entity UI:** React renderers selected only by view type. The browser does
   not parse canonical descriptors or receive operational research state.

## Data is not a component name

The initial data type is `markdown`: its payload identifies a confined body
file. A view type is independently one of `label`, `tile`, `card`, or `full`.
Code-owned adapters convert safe presentation data into those common view
models. A later data type can reuse a card without creating another card
renderer; a new view does not require a new persisted data type.

Explicit occurrence overrides win, then entity context overrides, then an
entity default. Site context defaults and the data-type fallback apply only
when the entity has not explicitly selected a view. Invalid explicit choices
are errors, not silent fallbacks.

<!-- BEGIN AGENT-MANAGED: research-summary -->

## Review checklist

- Validate persisted data independently of view-model schemas.
- Filter hidden entities, taxonomy, links, and citations before adapting.
- Emit only reachable registered view models and deterministic search data.
- Keep Markdown inert: no HTML, JSX, remote images, or executable blocks.
- Prove a synthetic second data type can adapt into an existing common view.

This architecture note starts unverified. External evidence collection and
three real supervised refresh cycles remain pending; fixture tests do not
count as research cycles.

<!-- END AGENT-MANAGED: research-summary -->
