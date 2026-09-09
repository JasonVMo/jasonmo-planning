# Event view, version 1

Schema: `EventViewModel`. Required fields are `title`, `summary`, entity-route
`href`, `kind`, `status`, `schedule`, and sanitized Markdown `body`. Optional
`location` is plain text. `CalendarEvent` is the same presentation without body.
Kinds are event, appointment, deadline, and reminder; statuses are confirmed,
tentative, and cancelled. Status is always text, not color alone.

The schedule is either an all-day date range with an **exclusive** end date,
or two explicit-offset timestamps and an IANA time zone. Actual instants order
timed events; calendar dates never shift with the viewer's time zone.

Compatible with collection, relationship, and detail contexts. The event data
adapter prefers this view for collection and detail when permitted; relationships
default to tile unless explicitly overridden. Generic label,
tile, card, and full views remain independent alternatives. An explicit
incompatible override fails rather than falling back.

The renderer dispatches only by view type. Detail includes preparation/body
text, original-zone timing, location, kind, status, and a link to that day.
Collection and relationship occurrences use compact headings and omit body
text. `compact` is a code-owned rendering option, not an entity-authored prop.
Cancelled items retain their details and explicit status.

The site's Calendar route collects only audience-projected, permitted event
view models. An event view is reachable from that route even when another
view is selected for entity detail. Removing event from permitted views
removes that entity from the aggregate calendar. The site constructs bounded
calendar DTOs by selecting summary fields; it does not import canonical data,
infer events from research timestamps, or parse dates from Markdown.

Tentative items do not enter the month, day, or timeline calendar models.
Tentative standalone event suggestions appear in a separate **Suggested
activities** widget; tentative reservation appointments remain action items
outside the calendar.

Synthetic stories cover appointments, multi-day/all-day events, cancellation,
compact occurrences, long text, light/dark, narrow screens, and a second
synthetic data type using the same renderer.

Trip, flight, and reservation adapters also reuse this presentation without
changing its generic kind/status enums. Trips convert inclusive dates to an
exclusive all-day end; flights span first departure to last arrival;
reservations copy the existing schedule. Their dedicated travel data/view
specifications define the explicit status mappings. Event permission remains
the aggregate-calendar opt-in for every compatible data type.
