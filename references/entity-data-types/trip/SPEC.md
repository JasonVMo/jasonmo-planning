# Trip data contract, version 1

Authority: `TripData` in `packages/entity-model/schemas/contracts.schema.json`;
entry point: `data-types/trip.schema.json`. Select `dataType: trip` and
`dataVersion: 1` in the unchanged base envelope.

Required fields:

- `bodyPath`: confined `.md` file using the existing Markdown loader,
  sanitization, ownership, size limits, and audience-link filtering.
- `kind`: `trip` (root) or `segment`.
- `status`: `planned`, `confirmed`, `active`, `completed`, or `cancelled`.
- `startDate`, `endDate`: Gregorian calendar dates, both **inclusive**.
  The end must be on or after the start; same-day trips are valid.
- `destination`: nonempty public-safe plain text, at most 500 characters.
- `timeZone`: named IANA zone, including `UTC`; numeric offsets are not zones.
- optional `banner` metadata for an entity-local `banner.jpg`: source URL,
  credit, public-domain/CC0 license, and the exact SHA-256 fingerprint of the
  resized asset.
- `children`: zero to 200 `{targetId, role, order}` records. `order` is a
  nonnegative integer, unique per parent. Storage order is not authoritative:
  adapters sort numerically by `order`.

Roles are `segment`, `flight`, `reservation`, `things-to-do`, `hikes-walks`,
`restaurants`, and `getting-ready`. Segment/flight/reservation roles require
matching data types; research roles require Markdown. Targets must exist and
cannot repeat within a parent. Roots cannot be children. Each segment has
exactly one parent and reaches exactly one trip root; nested segments are
allowed, but cycles and shared segment ownership are rejected after corpus
load. Single-segment trips can own research directly without a segment entity.

Calendar adapters produce a generic `event` with an all-day schedule. They
add one calendar day to inclusive `endDate` to obtain the calendar contract's
exclusive end. This is UTC date arithmetic, never local-time arithmetic.
The exclusive result must remain in supported years 0100–9998, so the latest
trip end is 9998-12-30. The `tripRange` semantic keyword enforces ordering
and this projection boundary alongside the existing calendar formats.
`planned` maps to tentative, `cancelled` to cancelled, and other statuses to
confirmed. Calendar singleton views retain the trip's display time zone.

## Views and privacy

Adapters support label, tile, card, full, trip, event, calendar-month,
calendar-day, and timeline. Collection/detail prefer trip when permitted.
Explicit incompatible defaults still fail; omit `defaultType` to use normal
context defaults. Event permission opts into the site calendar independently
of the dedicated trip view. Calendar summaries never contain Markdown bodies.

Trip children contain only selected, audience-visible targets' title, summary,
entity href, role, and order. No canonical objects, target payloads, paths,
booking identifiers, or operational state are copied. Hidden child labels are
omitted; segments beneath hidden parents are excluded recursively to preserve
parent closure. Links in bodies use the same filtered entity set.

Trip banners are fixed at 1200x480 JPEG and remain under the repository's
256 KiB canonical-file ceiling. Validation requires metadata and file presence
to agree, verifies JPEG dimensions and bytes against the stored fingerprint,
and projects only a same-origin hashed URL and digest. Builds copy only assets
referenced by the audience-filtered manifest.

This is an additive opt-in type, not a migration of existing Markdown or event
entities. No stable IDs, manual regions, provenance, ownership, publication
approval, or destinations change. New authoring remains private/local. No
archive routing or canonical lifecycle rewriting is implemented by this
contract. Confirmation and other private booking fields are absent and rejected.
