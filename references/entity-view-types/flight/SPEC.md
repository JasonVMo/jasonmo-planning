# Flight view, version 1

`FlightViewModel` is a closed browser DTO containing title, summary,
entity-route href, status, sanitized Markdown body, and nonempty ordered legs.
Each leg contains only carrier, flightNumber, origin, destination, departAt,
departureTimeZone, arriveAt, and arrivalTimeZone. The independent browser
contract validates offset instants, IANA zones, positive durations, and
chronological non-overlapping leg order.

Compatible contexts: collection, relationship, detail. Flight data prefers
flight for collection/detail when permitted; common and calendar views remain
available. Dispatch is by view type, not persisted data type.

Detail uses an article with textual direct/connecting and status badges, an h1,
and an ordered flight-leg list. Compact collection/relationship occurrences use
a dedicated Fluent UI `Card` with the locally bundled Google Material `flight`
symbol font glyph. Carrier names
drop redundant suffixes (`American Airlines` becomes `American`), airport codes
are positioned origin-to-destination without repeated departure/arrival labels,
and local timestamps use short zone labels such as PDT/CDT rather than exposing
IANA identifiers. Each leg retains semantic times, elapsed duration, and
connection duration. Duration is a display approximation to the nearest minute;
canonical comparisons retain full timestamp precision. Compact cards omit body
text. Cancellation/delay are textual states, not color alone.
The shared [activity-card header](../card/ACTIVITY.md) supplies the dark blue
gradient and can accept a reviewed image background later.

Compiler projections explicitly allowlist each leg field and sanitize body
Markdown. No booking locator, confirmation, private address, canonical path,
or operational research state can enter this model.

Synthetic stories cover direct and connecting itineraries, every status,
short local-zone labels, the generic airplane graphic, compact rendering of
another synthetic data type, narrow and dark layouts. Accessible ordered
lists/definition lists, wrapping text, visible keyboard focus, and Fluent
tokens are shared with the trip renderer.
