# Flight data contract, version 1

Authority: `FlightData`, `FlightLeg`, and `FlightLegs` in
`packages/entity-model/schemas/contracts.schema.json`; entry point:
`data-types/flight.schema.json`. Use `dataType: flight`, `dataVersion: 1`.

The closed payload requires a confined Markdown `bodyPath`, `status`
(`scheduled`, `delayed`, `cancelled`, or `completed`), and a nonempty ordered
`legs` array (at most 32). A leg requires all of:

- plain-text `carrier`, `flightNumber`, `origin`, and `destination`;
- `departAt` and `arriveAt`: valid explicit-offset calendar timestamps;
- `departureTimeZone` and `arrivalTimeZone`: named IANA zones.

Text is nonempty and bounded to 500 characters; HTML/control characters are
rejected. Flight numbers and airports are strings, not inferred identifiers.
Each arrival instant must be strictly after its departure. A later leg cannot
depart before the previous arrival; touching endpoints are allowed. The
`flightLegOrder` keyword validates chronological, non-overlapping array order
with arbitrary fractional-second precision. Legs are never silently sorted.
Named zones control display; timestamp offsets define absolute instants,
including overnight, cross-zone, and daylight-saving transitions.
Airport-local endpoint dates and the aggregate schedule in the first
departure zone must remain within the calendar contract's years 0100–9998.

Adapters support label, tile, card, full, flight, event, calendar-month,
calendar-day, and timeline. Collection/detail prefer flight. The generic
timed calendar event spans first departure through final arrival and uses
the first departure's zone. Cancelled maps to cancelled; other flight statuses
map to confirmed. The dedicated flight presentation retains the full status.
Permitting event opts into the aggregate calendar, independently of detail.

Every projected leg is built using explicit field allowlists. Body text passes
through the unchanged confined Markdown pipeline and audience filters.
Confirmation codes, booking locators, loyalty information, and arbitrary
fields are absent and rejected, not accepted and hidden with CSS.

This is an additive opt-in contract. Existing content and IDs are unchanged;
new authoring remains private/local. It grants no ownership or publication
authority and introduces no booking imports, live flight queries, recurrence,
archive routes, or deployment.
