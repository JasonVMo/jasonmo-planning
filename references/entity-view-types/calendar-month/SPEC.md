# Month-at-a-glance view, version 1

Schema: `CalendarMonthViewModel`: `title`, selected calendar `date`, IANA
`timeZone`, and `events` containing browser-safe `CalendarEvent` summaries.
No canonical payload, body text, arbitrary props, or hidden entity references.
Compatible with collection and detail. Event, trip, flight, and reservation
adapters can supply a single-item calendar; the site aggregates eligible
event presentations. Trip end dates are converted from inclusive to exclusive
before this view; flight intervals span all legs; reservation schedules
already use the calendar contract. The renderer never performs data-type dispatch.

The view renders a Monday-first, six-week month table. Each day links to
`#/calendar/day/YYYY-MM-DD?timeZone=<encoded-zone>`. The selected date is
marked with `aria-current="date"`; it is not mislabeled as today. Adjacent
month days are navigable. Up to three event links appear per cell, with an
explicit overflow link to the complete day. All-day and overnight events
appear on each occupied day; exclusive midnight ends do not add an extra day.
Cancelled events remain visible and count toward the displayed item count.

Narrow containers retain the seven-column date grid, accessible full-date
labels and event counts, with the complete agenda one activation away.
Native table semantics, keyboard-focusable links, text statuses, visible
focus and forced-color selection preserve accessibility without pretending
to implement an ARIA spreadsheet.

Site controls provide previous/next month, Today, a validated date input,
month/day switching, and viewer time-zone selection. URL state survives
reload and history navigation. Month stepping clamps the day at month end
(January 31 to February 28/29). Invalid dates/zones surface an error.
Calendar navigation is bounded to years 0100 through 9998.
