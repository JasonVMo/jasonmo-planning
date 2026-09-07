import type { CalendarDayViewModel, CalendarEvent } from "@planning/entity-model";
import { useId } from "react";
import {
  dateAt,
  eventLastDate,
  eventsOnDate,
  eventTime,
  formatCalendarDate,
  hasTimeConflict,
} from "../calendar.ts";
import { EventBadges } from "./EventView.tsx";

function AgendaItem({
  event,
  date,
  timeZone,
  conflict,
}: {
  event: CalendarEvent;
  date: string;
  timeZone: string;
  conflict: boolean;
}) {
  const schedule = event.schedule;
  const startsBefore = !schedule.allDay && dateAt(schedule.startAt, timeZone) < date;
  const endsAfter = !schedule.allDay && eventLastDate(event, timeZone) > date;
  return (
    <li className="tracker-agenda__item" data-status={event.status}>
      <div className="tracker-agenda__time">
        {eventTime(event, timeZone)}
        {startsBefore ? <small>Continues from previous day</small> : null}
        {endsAfter ? <small>Continues into next day</small> : null}
      </div>
      <article className="tracker-agenda__event">
        <EventBadges {...event} />
        <h3>
          <a href={event.href}>{event.title}</a>
        </h3>
        <p>{event.summary}</p>
        {event.location ? (
          <p className="tracker-agenda__location">Where: {event.location}</p>
        ) : null}
        {conflict ? <p className="tracker-agenda__conflict">Overlaps another event</p> : null}
      </article>
    </li>
  );
}

export function CalendarDayView({ title, date, timeZone, events }: CalendarDayViewModel) {
  const headingId = useId();
  const items = eventsOnDate(events, date, timeZone);
  const allDay = items.filter((event) => event.schedule.allDay);
  const timed = items.filter((event) => !event.schedule.allDay);
  const active = items.filter((event) => event.status !== "cancelled");
  return (
    <section className="tracker-day" data-view-type="calendar-day" aria-labelledby={headingId}>
      <header className="tracker-day__header">
        <div>
          <h2 id={headingId}>{title}</h2>
          <p>
            {formatCalendarDate(date)} · {timeZone}
          </p>
        </div>
        <p className="tracker-day__count">
          <strong>{active.length}</strong> scheduled{" "}
          <span>{items.length - active.length} cancelled</span>
        </p>
      </header>
      {allDay.length > 0 ? (
        <section className="tracker-day__all-day" aria-label="All-day events">
          <h3>All day</h3>
          <ul className="tracker-agenda">
            {allDay.map((event) => (
              <AgendaItem key={event.href} {...{ event, date, timeZone }} conflict={false} />
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-label="Timed agenda">
        <h3>Schedule</h3>
        {timed.length > 0 ? (
          <ul className="tracker-agenda">
            {timed.map((event) => (
              <AgendaItem
                key={event.href}
                {...{ event, date, timeZone }}
                conflict={hasTimeConflict(event, timed)}
              />
            ))}
          </ul>
        ) : (
          <p className="tracker-calendar__empty">
            {items.length === 0
              ? "No events on this day."
              : "No timed events. Your day is open around the all-day items."}
          </p>
        )}
      </section>
    </section>
  );
}
