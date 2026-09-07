import type { CalendarMonthViewModel } from "@planning/entity-model";
import { useId } from "react";
import {
  addCalendarDays,
  calendarHref,
  eventsByDate,
  eventTime,
  formatCalendarDate,
} from "../calendar.ts";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function CalendarMonthView({ title, date, timeZone, events }: CalendarMonthViewModel) {
  const headingId = useId();
  const first = `${date.slice(0, 7)}-01`;
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  const dates = Array.from({ length: 42 }, (_, index) => addCalendarDays(first, index - offset));
  const eventsByDay = eventsByDate(
    events,
    dates.filter((day) => day !== null),
    timeZone,
  );
  return (
    <section className="tracker-month" data-view-type="calendar-month" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <table className="tracker-month__grid">
        <caption className="tracker-calendar__sr-only">
          {formatCalendarDate(date, { month: "long", year: "numeric" })}, {timeZone}
        </caption>
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th key={day} scope="col">
                <abbr title={day}>{day.slice(0, 3)}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, week) => (
            <tr key={week}>
              {Array.from({ length: 7 }, (_, weekday) => {
                const day = dates[week * 7 + weekday];
                if (!day) return <td key={weekday} aria-label="Outside supported date range" />;
                const items = eventsByDay.get(day)!;
                const href = calendarHref("day", day, timeZone);
                return (
                  <td
                    key={day}
                    data-outside={day.slice(0, 7) !== date.slice(0, 7)}
                    data-selected={day === date}
                  >
                    <a
                      className="tracker-month__date"
                      href={href}
                      aria-current={day === date ? "date" : undefined}
                      aria-label={`${formatCalendarDate(day)}, ${items.length} ${items.length === 1 ? "event" : "events"}`}
                    >
                      <span>{Number(day.slice(8))}</span>
                      {items.length > 0 ? (
                        <span className="tracker-month__count">{items.length}</span>
                      ) : null}
                    </a>
                    <ul className="tracker-month__events">
                      {items.slice(0, 3).map((event) => (
                        <li key={event.href}>
                          <a
                            href={event.href}
                            data-status={event.status}
                            title={`${event.title}: ${eventTime(event, timeZone)} (${event.status})`}
                          >
                            <span className="tracker-month__event-time">
                              {eventTime(event, timeZone)}
                            </span>
                            <span>{event.title}</span>
                            {event.status !== "confirmed" ? (
                              <span className="tracker-month__status">{event.status}</span>
                            ) : null}
                          </a>
                        </li>
                      ))}
                      {items.length > 3 ? (
                        <li>
                          <a className="tracker-month__more" href={href}>
                            +{items.length - 3} more
                          </a>
                        </li>
                      ) : null}
                    </ul>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tracker-calendar__hint">
        Select a date for its full agenda. Times shown in {timeZone}.
      </p>
    </section>
  );
}
