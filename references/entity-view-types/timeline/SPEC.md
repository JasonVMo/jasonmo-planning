# Compact navigation timeline, version 1

Schema: `TimelineViewModel`: `title`, selected calendar `date`, IANA
`timeZone`, and browser-safe `events` (`CalendarEvent` summaries).
Compatible with navigation, collection, and detail.

Seven consecutive days surround the selection. Every day shows a weekday,
month/day, textual event count or Open label, and a capped activity bar.
The bar saturates at five events; the exact count remains visible. Cancelled
items are counted because they remain visible in the agenda. Earlier/Later
links shift one week. Date links open the day route and preserve time zone.

The selected date is exposed with `aria-current="date"`. Native links work
with Tab/Enter; Left/Right and Home/End move focus inside the strip without
activating a route. At narrow widths, only the strip scrolls horizontally;
focused links scroll into view. A visible outline distinguishes selection
in forced-color mode. The component is reusable independently of the site
shell and knows nothing about persisted data types.
