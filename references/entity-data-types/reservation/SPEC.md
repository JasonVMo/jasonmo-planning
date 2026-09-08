# Reservation data contract, version 1

Authority: `ReservationData` in
`packages/entity-model/schemas/contracts.schema.json`; entry point:
`data-types/reservation.schema.json`. Use `dataType: reservation`,
`dataVersion: 1` in the unchanged entity envelope.

Required fields are:

- `bodyPath`: a confined Markdown `.md` file with existing body safety,
  managed-region, size, and audience-link rules.
- `kind`: `lodging`, `rental-car`, `ticket`, `tour`, or `transit`.
- `status`: `confirmed`, `tentative`, `needs-booking`, `cancelled`, or `completed`.
- `provider`: nonempty plain text, at most 500 characters.
- `schedule`: the existing strict `EventSchedule`, either all-day dates with
  an **exclusive** end, or explicit-offset instants and a named IANA zone.

Optional `location` is public-safe plain text (500 characters maximum).
Optional `bookingUrl` is a public-safe HTTP(S) URL (2000 characters maximum),
never a personalized account, session, confirmation, or locator link.
Credentials in URL user information and unsafe URL syntax are rejected during
corpus loading. Neither provider nor bookingUrl is automatically added to browser views: common views
use the safe title/summary/body, and event models add schedule/status/location.
An intentionally authored public link in Markdown still passes URL policy.
Confirmation codes, booking locators, loyalty numbers, private addresses, and
unknown fields are rejected.

No reservation-specific renderer is needed. Adapters support label, tile,
card, full, event, calendar-month, calendar-day, and timeline. Collection/detail
prefer event. The calendar schedule is copied field-by-field without date
conversion. Kind maps to generic `appointment`; tentative/needs-booking map
to tentative, cancelled to cancelled, and confirmed/completed to confirmed.
Calendar collection items contain no body. Event permission remains the
explicit aggregate-calendar opt-in.

This additive opt-in type does not migrate existing Markdown or event data.
Stable identity, manual sections, central ownership, provenance, private/local
defaults, and publication gates are unchanged. No credentials, confirmation
details, archive routes, booking integrations, or deployment are introduced.
