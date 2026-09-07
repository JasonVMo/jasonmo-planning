# Day-at-a-glance view, version 1

Schema: `CalendarDayViewModel`: `title`, selected calendar `date`, IANA
`timeZone`, and `events` containing browser-safe `CalendarEvent` summaries.
Compatible with collection and detail. No persisted day entity is required.

The full-width day agenda separates all-day items from timed appointments
and shows active/cancelled totals. Timed entries are sorted by actual start
instant, with title links, kind/status badges, time ranges, summaries,
locations, and continuation labels for overnight/multi-day entries.
Overlapping active timed events have a textual conflict notice. Adjacent
intervals and cancelled events are not conflicts. All entries remain
available; there is no month-cell truncation.

Time-zone conversion happens before day membership and display. All-day
dates stay unchanged. End timestamps/dates are exclusive for day membership.
Offset-aware instants support daylight-saving transitions. This is a readable
agenda rather than a draggable 24-hour appointment editor; no persistence or
external calendar writes occur.

Empty days explicitly state that no events are scheduled. A day containing
only all-day entries states that there are no timed events. Narrow containers
stack time and event detail instead of hiding information.

The actual site combines the view with the compact navigation timeline and
date/period/time-zone controls. Entity links open full event details; "View
this day" returns using the event's original zone (UTC for date-only events).
