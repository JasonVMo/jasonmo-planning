# Personal Tracker Delivery Plan

**Status:** Approved for execution

**Planning baseline:** 2026-09-08

**Purpose:** Replace the completed repository bootstrap plan with the actionable
roadmap for the real personal tracking site.

This plan defines product structure and implementation order. It does not grant
publication approval, verify external facts, or authorize unattended research.
Durable engineering constraints live in
[the architecture reference](references/architecture.md), and owner-confirmed
research preferences live in
[the research profile](references/research-profile.md).

## Execution result

The initial roadmap was executed on 2026-09-08:

- trip, flight, reservation, trip-view, and flight-view contracts are active;
- the final Dashboard, Calendar, Trips, Events, and Archive routes are active;
- Sequoia and Acadia/NYC are represented as single- and multi-segment trips;
- selected Seahawks games, concerts, productions, and festivals are seeded;
- Archive uses the confirmed five-week threshold from each item's end date;
- three supervised research cycles are recorded;
- the exact public projection is approved, audited, and configured to deploy
  from `main`.

Dynamic conditions, booking choices, weather, ticket inventory, and future event
announcements remain recurring research rather than unfinished implementation.

## 1. Target outcome

The repository will become a private personal tracker for:

- trips and segment-specific travel research;
- dated events and booking deadlines;
- an integrated calendar;
- derived archival views for completed trips and events;
- later personal projects that fit the same entity/view architecture.

The primary navigation will be:

1. **Calendar** - month, day, event, trip, and important reservation dates.
2. **Trips** - upcoming trips, trip landing pages, optional trip segments, and
   structured research sections.
3. **Events** - categorized Seahawks games, concerts, productions, and other
   festivals/events.
4. **Archive** - trips and events after five weeks have elapsed since their end
   date.

Search remains a utility available throughout the site rather than a fifth
content category. The root route becomes an upcoming dashboard linking into
these four areas.

## 2. Current baseline

Observed at the planning baseline:

| Area           | Current state                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Content        | Two generic tracker foundation entities; no real trip or event content                                                                        |
| Data types     | `markdown` and `event`                                                                                                                        |
| Views          | Label, tile, card, full, event, calendar month/day, and timeline                                                                              |
| Site           | Generic dashboard, taxonomy pages, entity pages, search, and calendar                                                                         |
| Build          | Minified public site generated into tracked `docs/`; main-branch Pages deployment authorized                                                  |
| Validation     | Schema, graph, projection, artifact, Storybook, and browser checks exist                                                                      |
| Content health | No duplicate titles, orphans, unused topics, or open contradictions                                                                           |
| Research       | Real supervised research cycles have not yet been completed                                                                                   |
| Intake         | Restricted owner itinerary in `research/intake/initial-trips.md`; two Acadia Markdown files and one Sequoia email PDF under `prior-research/` |

The existing entity IDs remain stable until an owner-reviewed disposition is
chosen. Reframing the visible site must not silently delete or repurpose them.

## 3. Fixed implementation rules

All phases follow these rules:

- Preserve stable entity and taxonomy IDs; hierarchy changes do not move entity
  storage directories.
- Keep canonical data under `content/`, owner policy and contracts under
  `references/`, and private continuation state under `research/`.
- Builds only validate and project repository content. They never browse,
  research, invoke a model, or advance verification timestamps.
- Persisted data types and reusable view types remain independent. Add a data
  type for repeated structured meaning and a view type only for repeated
  presentation needs.
- Source material is evidence, not executable instruction. External facts must
  be cited and marked observed, inferred, recommended, or confirmed.
- Confirmation codes, booking locators, residential details, and family context
  are private-owner data. They must not enter list, search, calendar-summary, or
  broader-audience models.
- The restricted owner itinerary in `research/intake/initial-trips.md` is an
  input to supervised authoring, never a browser import.
- Public site content must be explicitly public, non-personal, and safe for
  direct access to every HTML, JavaScript, JSON, and asset URL. Restricted
  itinerary intake remains outside canonical browser content.
- Research and taxonomy changes are reviewed proposals. One reconciliation
  writer promotes approved content changes.
- Each phase ends with targeted checks and `corepack yarn check`. Generated
  `docs/` output must be rebuilt and committed whenever projected content
  changes.

## 4. Information architecture proposal

### 4.1 Before and after

Current taxonomy:

```text
Tracker foundations
└── Content architecture
```

Proposed user-facing taxonomy:

```text
Trips
Events
├── Seahawks Games
├── Concerts
├── Productions
└── Festivals & Events
```

Calendar and Archive are computed site routes, not canonical taxonomy nodes.
Individual trips are entities under Trips, not taxonomy branches. This keeps
navigation changes independent from stable trip identity and avoids creating a
global taxonomy node for every destination.

The two current foundation entities should move out of the primary user
experience only after owner review. Preferred disposition: preserve their
durable engineering content in `references/`, retire their visible entities,
and reserve their IDs. Do not delete or archive them automatically as part of a
taxonomy edit.

### 4.2 Trip hierarchy

A trip is always the stable root entity.

- A **single-segment trip** places research sections directly on the trip
  landing page.
- A **multi-segment trip** has ordered segment entities. Each segment owns its
  research sections.
- Flights and reservations link to the narrowest applicable trip or segment.
- Research pages use consistent roles: Things to Do, Hikes & Walks,
  Restaurants, and Getting Ready. A role may be omitted when irrelevant.
- The trip landing page summarizes the complete date range, transport,
  lodging, unresolved bookings, and segment timeline.
- Canonical entity routes remain stable. Trips and Events pages provide the
  hierarchy, breadcrumbs, and grouping without encoding taxonomy paths into
  IDs or storage.

Example:

```text
Acadia & New York City
├── Overall itinerary, flights, and unresolved bookings
├── Acadia National Park & Bar Harbor
│   ├── Things to Do
│   ├── Hikes & Walks
│   ├── Restaurants
│   └── Getting Ready
└── New York City & Hoboken
    ├── Things to Do
    ├── Restaurants
    └── Getting Ready
```

### 4.3 Archive behavior

Archive is a presentation state, not an automated canonical move:

- derive the effective end date from the structured trip or event schedule;
- derive trip archival from the trip's inclusive `endDate`, not from its last
  segment, flight, reservation, research update, or build time;
- keep an item active until five weeks (35 calendar days) have elapsed after
  its end date;
- show it in Archive at midnight on the 35th day after its end date, evaluated
  in `America/Los_Angeles`;
- keep its stable entity route and relationships;
- exclude archived items from default upcoming lists while retaining search
  access;
- let an explicit canonical `archived` lifecycle override the computed state
  for cancellations or owner-directed retirement.

Browser tests will use a fixed clock around boundary dates. No build or agent
will rewrite taxonomy merely because time passed.

## 5. Required content and view contracts

Phase 1 will refine these shapes with representative fixtures before changing
canonical content.

| Contract                   | Purpose                                               | Required behavior                                                                                        |
| -------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Existing `markdown` data   | Narrative research pages                              | Continue using safe Markdown and existing common views                                                   |
| Existing `event` data      | Games, concerts, productions, festivals, deadlines    | Continue adapting to event and calendar views                                                            |
| New `trip` data            | Trip roots and optional segments                      | Date range, status, destination/base, ordered segments or sections, summary body, archive date           |
| New `flight` data          | Standard flight representation                        | One journey with ordered legs, airports, carriers/numbers, local times/zones, status, owner-only locator |
| New `reservation` data     | Lodging, rental car, ticket, tour, or transit booking | Kind, provider, schedule, status, location, booking URL, owner-only confirmation details                 |
| New trip composition model | Ordered landing-page hierarchy                        | Stable target IDs, section roles, order, occurrence view choice, no cycles or duplicate ownership        |
| New `trip` view            | Trip/segment landing page                             | Itinerary summary, open actions, reservations, and section links                                         |
| New `flight` view          | Reusable formatted flight tile/detail                 | Leg sequence, airport/time display, duration/connection state, status; locator only in owner detail      |

Implementation constraints:

- Add each data contract to JSON Schema, generated TypeScript, loader
  validation, projection, adapter fixtures, and its own `SPEC.md`.
- Use the existing common card/full views for reservations unless real fixtures
  prove a dedicated reservation view is necessary.
- Keep trip composition inside the trip contract initially. Do not introduce a
  generic page-builder or arbitrary component configuration.
- Validate that each segment belongs to exactly one trip, composition is
  acyclic, ordered targets exist, and audience filtering preserves parent
  closure.
- Project private details through an explicit private-owner detail model only.
  Never spread canonical reservation or trip objects into the browser DTO.
- Derive calendar entries from safe adapters rather than creating duplicate
  event entities for the same flight or trip.
- Store end dates as exclusive where the existing calendar contract requires
  it, and document display conversions in the relevant specification.

## 6. Phased plan of action

### Phase 0 - Approve structure and normalize intake

**Entry:** This plan and the existing bootstrap implementation.

**Actions:**

1. Use the proposed taxonomy and preserve the two current foundation entities
   as retired IDs after their durable guidance is represented in references.
2. Use 2026 for all supplied itinerary dates.
3. Use LGA, New York's LaGuardia Airport, for the NYC arrival.
4. Use the trip end date and a five-week (35-day) Archive threshold evaluated
   in `America/Los_Angeles`.
5. Classify itinerary fields:
   - trip dates, destinations, and general research as private;
   - confirmation codes, account/loyalty identifiers, addresses, and family
     context as private details excluded from summaries and search;
   - external research URLs according to source access.
6. Record stable IDs for the approved taxonomy and seed entities before
   creating files.
7. Inventory the restricted owner itinerary and three `prior-research/` inputs
   by path and SHA-256. Treat them as source material until each claim is
   reconciled.

**Exit gate:** Taxonomy/ID table, confirmed date/airport/archive decisions,
sensitive field map, and source inventory are recorded.

### Phase 1 - Add trip, flight, and reservation contracts

**Entry:** Phase 0 decisions.

**Actions:**

1. Write representative synthetic fixtures for:
   - one direct single-segment trip;
   - one two-segment trip;
   - one direct flight and one connecting journey;
   - booked, tentative, cancelled, and needs-booking reservations;
   - owner-only confirmation details;
   - archive boundary dates.
2. Add `trip`, `flight`, and `reservation` data schemas and specifications.
3. Add bounded trip composition and graph validation.
4. Add trip and flight view-model schemas and renderer specifications.
5. Register data/view adapters, keeping renderers keyed only by view type.
6. Extend the browser manifest parser with exact allowlists for the new models.
7. Add projection tests proving private details are absent from list, search,
   calendar, private-group, and public shapes.
8. Add migration notes stating that current Markdown/event entities remain
   unchanged and no date is inferred from body text.

**Exit gate:** All synthetic contracts, adapters, renderers, schema drift
checks, artifact audits, Storybook states, and unit tests pass without creating
real trip content.

### Phase 2 - Build the real navigation and collection pages

**Entry:** Phase 1 contracts.

**Actions:**

1. Replace the generic topic-first shell with the four primary navigation
   destinations and secondary Search access.
2. Turn the root route into an upcoming dashboard showing:
   - next trip;
   - upcoming events;
   - unresolved booking/preparation actions;
   - a compact calendar/timeline.
3. Add Trips and Events index pages backed only by projected manifest data.
4. Add segment-aware breadcrumbs and landing-page composition.
5. Add empty, loading, missing-target, and audience-filtered states.
6. Keep durable `#/entities/<stable-id>` routes working for direct links.
7. Remove the Markdown demonstration page from primary navigation; retain it
   only as development documentation or Storybook coverage.
8. Add narrow, dark, forced-colors, focus, direct-load, and not-found browser
   coverage for the new routes.

**Exit gate:** Synthetic single- and multi-segment trips can be navigated
through the final shell at `/` and `/jasonmo-planning/`, with no canonical real content.

### Phase 3 - Seed the Sequoia single-segment vertical slice

**Entry:** Phase 2 site and approved Phase 0 IDs.

**Canonical trip intake to verify:**

- Seattle to Fresno on September 15; Alaska 383, scheduled 12:59 PM-3:21 PM.
- Budget rental car via Costco Travel, September 15 at 4:00 PM through
  September 20 at 3:00 PM.
- Three Rivers lodging, September 15 at 4:00 PM through September 20 at
  11:00 AM.
- Fresno to Seattle on September 20; Alaska 394, scheduled 4:21 PM-6:39 PM.
- Existing email source:
  `prior-research/sequoia/email-discussion.pdf`.

Confirmation numbers, the Fastbreak number, the complete lodging address, and
the private booking URL remain owner-only intake in
`research/intake/initial-trips.md`. Do not repeat them in summary, calendar,
search, or research prose.

**Actions:**

1. Create the Sequoia trip root using the single-segment form.
2. Create structured outbound/return flight and rental/lodging reservation
   entities.
3. Create research pages for:
   - Things to Do;
   - Hikes & Walks grouped by park region;
   - Restaurants near useful bases;
   - Getting Ready.
4. Extract permitted facts from the email PDF with claim-level provenance.
5. Research Kings Canyon, park hours/closures, reservations, drive-time
   constraints, and credible travel-planning sources.
6. Research expected weather separately for Three Rivers, Foothills Visitor
   Center, and Lodgepole Visitor Center; label forecasts versus climate norms.
7. Produce suggested day groupings without presenting recommendations as
   confirmed bookings.
8. Add research state, source manifests, evidence notes, and review dates for
   every new entity.

**Exit gate:** The trip is usable end to end in Trips, Calendar, Search, and
private-owner detail; each material external claim is sourced; open booking or
weather uncertainty is visible.

### Phase 4 - Seed the Acadia and New York multi-segment trip

**Entry:** The single-segment slice has passed and exposed no unresolved model
defects.

**Overall itinerary to verify:**

- October 5: SEA-ORD-BGR on AA 1872 and AA 3683.
- October 5-10: Enterprise rental car from Bangor airport.
- October 5-6: lodging still needs booking.
- October 6-10: Days Inn Bar Harbor.
- October 10: BGR-LGA on AA 4343.
- October 10-13: Hoboken lodging near Stevens Institute of Technology still
  needs booking.
- October 13: EWR-SEA on Alaska 373.
- Existing sources:
  `prior-research/acadia/things-to-do.md` and
  `prior-research/acadia/hiking.md`.

All confirmation codes remain private details and must be copied only from the
restricted owner itinerary into their structured owner-only fields.

**Actions:**

1. Create one overall trip root and ordered Acadia and NYC/Hoboken segments.
2. Attach shared flights and open lodging actions to the trip root; attach
   segment-specific reservations and research to each segment.
3. Acadia research:
   - arrival-night lodging;
   - Island Explorer bus routes and operating dates;
   - drive-versus-bus access and travel time for each hike;
   - weather and fall foliage;
   - surrounding day trips;
   - suggested day itineraries;
   - a rain plan.
4. NYC/Hoboken research:
   - confirm LGA-to-Hoboken transit options;
   - lodging near Stevens;
   - current Broadway shows, official show sites, demand/value, ticket sources,
     and showtimes for the trip dates;
   - notable dated events in Hoboken, Brooklyn, and NYC.
5. Preserve claim provenance while rewriting the prior Acadia Markdown.
6. After the canonical replacement is reviewed, validated, and demonstrably
   complete, remove only the two superseded prior-research Markdown files. Do
   not remove the source fingerprint or evidence record.
7. Add browser tests proving the extra segment layer appears only for the
   multi-segment trip.

**Exit gate:** The overall itinerary and each segment have complete navigation,
the two open lodging needs are prominent, route/access recommendations are
sourced, and no prior-research file is deleted before reviewed incorporation.

### Phase 5 - Establish recurring event categories

**Entry:** Trips and shared calendar adapters are stable.

**Actions:**

1. Promote the approved Events taxonomy with these stable categories:
   Seahawks Games, Concerts, Productions, and Festivals & Events.
2. Seed the selected Seahawks home games against authoritative schedule
   sources: Patriots, Chargers, Chiefs, and Giants. For each game include
   opponent, start time and zone, broadcast network, venue, ticket/attendance
   status, and special information.
3. Seed concert discovery using the owner interest profile, recording venue,
   performance time, on-sale time, official/ticketing links, and ticket status.
4. Seed productions for Seattle Rep, 5th Avenue, and Paramount from official
   calendars and production pages.
5. Use Festivals & Events for dated items that do not fit the other categories.
6. Distinguish an event of interest from a booked/attending event in structured
   status rather than prose alone.
7. Add explicit manual research cadences and next-review dates. Do not add
   unattended source connectors or scheduled commits.

**Exit gate:** Category pages, event detail, calendar placement, source links,
status, empty states, and audience filtering pass with a small reviewed seed
set in each category.

### Phase 6 - Complete calendar, archive, and dashboard behavior

**Entry:** Both trip shapes and all event categories have real fixtures.

**Actions:**

1. Include trip spans, flights, important reservation times, booking deadlines,
   and events in the calendar through their safe adapters.
2. Avoid duplicate trip/segment spans: show the overall trip by default and
   segment boundaries within trip detail unless explicitly opted into the
   calendar.
3. Add filters for trips, transport, reservations/deadlines, and event
   categories without exposing hidden counts.
4. Implement the Archive calculation from section 4.3.
5. Add upcoming versus archived groupings to Trips and Events.
6. Make overdue open booking actions visible on the dashboard without treating
   them as completed reservations.
7. Test all-day and timed boundaries, cross-zone flights, daylight-saving
   changes, cancelled events, direct route reloads, and mocked archive dates.

**Exit gate:** A fixed test clock produces deterministic active/archive
classification, calendar entries preserve source time zones, and all four
primary navigation areas are useful with real content.

### Phase 7 - Harden the real content workflow

**Entry:** The complete initial information architecture is populated.

**Actions:**

1. Run at least three owner-supervised research/update cycles across different
   content shapes: trip research, a booking update, and a recurring event
   refresh.
2. Prove stale hashes, contradictions, partial results, and source outages leave
   the previous valid site and verified conclusions intact.
3. Add duplicate/orphan/archive maintenance output relevant to trip
   composition.
4. Review search results and artifact files for confirmation codes, addresses,
   private source locators, hidden entities, and machine paths.
5. Review the usefulness of each new data/view type. Extract a generic
   collection contract only if another non-trip feature now needs the same
   ordered composition semantics.
6. Update user documentation and examples to use real structural patterns
   without embedding private itinerary data in application source.

**Exit gate:** `corepack yarn check`, content reports, artifact inventory, and
manual private-data inspection pass; the supervised research gate has real
evidence rather than synthetic fixtures.

### Phase 8 - Publish the approved public projection

**Entry:** All prior phases pass. Public GitHub Pages publication from `main`
is explicitly owner-authorized.

**Actions:**

1. Build only the public projection into `docs/`.
2. Prove private intake, confirmation codes, personal context, internal source
   locators, and non-public entities are absent from HTML, JavaScript, JSON,
   search data, and assets.
3. Reconcile the public audience with the publication policy, exact approval,
   and `deployable` manifest state.
4. Keep validation/build permissions separate from deployment permissions.
5. Configure the Pages workflow to deploy the audited `docs/` artifact after
   commits reach `main`, with manual dispatch available for recovery.

**Exit gate:** The public artifact is approval-bound and deployable, the
workflow publishes it only from `main` or manual dispatch, and privacy scans
find no restricted intake.

## 7. Dependency order

| Work item                         | Depends on                     | Can proceed in parallel with      |
| --------------------------------- | ------------------------------ | --------------------------------- |
| Intake decisions and stable IDs   | None                           | Synthetic schema fixture drafting |
| Trip/flight/reservation contracts | Approved semantics             | Taxonomy proposal review          |
| Real navigation                   | Projected contract shapes      | Synthetic Storybook renderers     |
| Sequoia content                   | Contracts, navigation, IDs     | Event source inventory            |
| Acadia/NYC content                | Proven single-segment slice    | Seahawks/venue source inventory   |
| Event categories                  | Taxonomy approval, event model | Acadia/NYC research               |
| Archive behavior                  | Real date-bearing fixtures     | Dashboard polish                  |
| Workflow hardening                | All initial content shapes     | Documentation cleanup             |
| Deployment                        | Explicit owner authorization   | Nothing that assumes publication  |

## 8. Plan-level acceptance criteria

The roadmap is complete when:

- the site exposes Calendar, Trips, Events, and Archive as the primary
  information architecture;
- single- and multi-segment trips use one coherent stable-ID model;
- flights have a standard structured tile and connecting-leg support;
- lodging, car, ticket, and action-needed reservations are distinguishable;
- every selected event carries useful date, venue, ticket/status, and source
  data;
- Sequoia and Acadia/NYC meet their trip-specific research requirements;
- items enter Archive only after the defined five-week grace period without
  canonical file moves;
- private details never appear in summary, search, calendar, or
  broader-audience output;
- prior research is incorporated with provenance before any superseded input is
  removed;
- real supervised refresh cycles preserve manual content and failure semantics;
- the minified public Pages artifact remains reproducible and is deployed only
  from the audited `docs/` output.

## 9. Deliberate non-goals

The initial real structure does not include:

- browser editing;
- automated purchases, bookings, or reservation changes;
- unattended research or scheduled direct commits;
- calendar import/synchronization, notifications, or recurrence;
- a database, CMS, backend, arbitrary page builder, MDX, or executable content;
- public search indexing or public Storybook;
- semantic/external search, remote cache, service worker, or offline storage;
- automatic deletion of entities, prior research, or owner-authored content.

Revisit these only when a demonstrated use case and the relevant privacy,
authorization, and ownership design exist.
