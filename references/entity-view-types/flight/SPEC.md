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

The article has textual direct/connecting and status badges, an h1 in detail
or h3 in compact collections, and an ordered flight-leg list. Each leg shows
carrier/number, airport names, semantic departure/arrival times in their
respective named zones, elapsed flight duration, and connection duration
before the next leg. Duration is a display approximation to the nearest
minute; canonical comparisons retain full timestamp precision. Compact
occurrences retain legs but omit body text. Cancellation/delay are textual
states, not color alone.

Compiler projections explicitly allowlist each leg field and sanitize body
Markdown. No booking locator, confirmation, private address, canonical path,
or operational research state can enter this model.

Synthetic stories cover direct and connecting itineraries, every status,
local-zone times, compact rendering of another synthetic data type, narrow
and dark layouts. Accessible ordered lists/definition lists, wrapping text,
visible keyboard focus, and Fluent tokens are shared with the trip renderer.
