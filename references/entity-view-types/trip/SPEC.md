# Trip view, version 1

`TripViewModel` is a closed browser DTO containing title, summary, entity-route
href, kind (`trip` or `segment`), status, inclusive start/end dates,
destination, IANA timeZone, an optional same-origin banner reference,
sanitized Markdown body, and ordered children.
Each child contains only title, summary, entity href, role, and order.
Children have strictly increasing unique nonnegative integer order; gaps left
by audience filtering are retained. No canonical target ID or payload is
required by the renderer.

Compatible contexts: collection, relationship, detail. Trip data prefers this
view for collection/detail when permitted. Render dispatch depends only on
view type, never persisted data type. Explicit incompatible selection fails
rather than substituting another view.

Detail uses an article/header, h1, textual kind/status badges, a definition
list with semantic inclusive dates, safe body, and separate ordered
**Itinerary** and **Research** sections. Segment, flight, and reservation
children form the itinerary. Research child links use their concise role label
(`Things to Do`, `Hikes & Walks`, `Restaurants`, or `Getting Ready`) because
the containing trip already supplies destination context. Compact
collection/relationship occurrences use the shared activity-card pattern and
omit the body and child list. Trip and segment activity cards use their own
Material Symbols treatment, and a validated banner replaces the default
gradient when present. Compact is a code-owned option, not persisted content.
Cancellation remains explicit text, not color alone. Missing sections have an
empty-state message.
The actual site may suppress the reference-only child lists and compose the
same audience-safe targets as cards: dedicated compact flight/event cards for
flights and reservations, compact trip views for segments, and the common card
view for research pages such as hikes.
Root trip collections retain deterministic calendar order by start date, then
end date and title, and render as a single vertical sequence rather than a
multi-column card grid.

Compiler projection happens after audience selection and parent closure.
Child titles/summaries never come from hidden entities, and canonical objects
are never spread into DTOs. Hidden Markdown links use the same filtered set. No private booking data is
accepted. A canonical banner is an entity-local 1200x480 JPEG no larger than
256 KiB. Its source URL, credit, public-domain/CC0 license, and exact SHA-256
fingerprint are validated; only a same-origin hashed URL and digest enter the
browser model. Builds copy only banners referenced by the audience-filtered
manifest.

Synthetic stories cover direct research sections, multiple segments,
individual segments, all statuses, empty content, keyboard focus,
light/dark, narrow widths, and a second synthetic data type. Shared Fluent
tokens, wrapping layout, visible focus, and semantic HTML support accessible
reusable rendering.
