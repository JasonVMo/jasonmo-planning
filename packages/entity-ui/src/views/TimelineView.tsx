import type { TimelineViewModel } from "@tracker/entity-model";
import { useId, type KeyboardEvent } from "react";
import { addCalendarDays, calendarHref, eventsByDate, formatCalendarDate } from "../calendar.ts";

function moveFocus(event: KeyboardEvent<HTMLAnchorElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const links = Array.from(
    event.currentTarget.parentElement!.querySelectorAll<HTMLAnchorElement>("a"),
  );
  const current = links.findIndex((link) => link === document.activeElement);
  const index =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? links.length - 1
        : current + (event.key === "ArrowRight" ? 1 : -1);
  event.preventDefault();
  links[Math.max(0, Math.min(links.length - 1, index))]?.focus();
}

export function TimelineView({ title, date, timeZone, events }: TimelineViewModel) {
  const headingId = useId();
  const previous = addCalendarDays(date, -7);
  const next = addCalendarDays(date, 7);
  const dates = Array.from({ length: 7 }, (_, index) => addCalendarDays(date, index - 3));
  const eventsByDay = eventsByDate(
    events,
    dates.filter((day) => day !== null),
    timeZone,
  );
  return (
    <nav className="tracker-timeline" data-view-type="timeline" aria-labelledby={headingId}>
      <div className="tracker-timeline__header">
        <h2 id={headingId}>{title}</h2>
        <div>
          {previous ? (
            <a href={calendarHref("day", previous, timeZone)} aria-label="Previous week">
              Earlier
            </a>
          ) : null}
          {next ? (
            <a href={calendarHref("day", next, timeZone)} aria-label="Next week">
              Later
            </a>
          ) : null}
        </div>
      </div>
      <div className="tracker-timeline__days">
        {dates.map((day, index) => {
          if (!day) return <span key={index} />;
          const count = eventsByDay.get(day)!.length;
          return (
            <a
              key={day}
              onKeyDown={moveFocus}
              href={calendarHref("day", day, timeZone)}
              aria-current={date === day ? "date" : undefined}
              aria-label={`${formatCalendarDate(day)}, ${count} ${count === 1 ? "event" : "events"}`}
            >
              <span>{formatCalendarDate(day, { weekday: "short" })}</span>
              <strong>{formatCalendarDate(day, { month: "short", day: "numeric" })}</strong>
              <span className="tracker-timeline__bar" aria-hidden="true">
                <span style={{ width: `${Math.min(count, 5) * 20}%` }} />
              </span>
              <small>{count === 0 ? "Open" : `${count} ${count === 1 ? "event" : "events"}`}</small>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
