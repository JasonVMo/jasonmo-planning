import { isCalendarDate, isTimeZone, type SiteManifest } from "@planning/entity-model";
import {
  addCalendarDays,
  addCalendarMonths,
  calendarHref,
  CalendarDayView,
  CalendarMonthView,
  dateAt,
  formatCalendarDate,
  TimelineView,
} from "@planning/entity-ui";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { calendarEventsForEntity } from "./archive.ts";

export function CalendarPage({ manifest }: { manifest: SiteManifest }) {
  const { calendarMode = "month", calendarDate } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());
  const [localZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const timeZone = params.get("timeZone") ?? localZone;
  useEffect(() => {
    if (!isTimeZone(timeZone)) return;
    const refresh = () => {
      const instant = Date.now();
      setNow((previous) =>
        dateAt(previous, timeZone) === dateAt(instant, timeZone) ? previous : instant,
      );
    };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [timeZone]);
  const events = useMemo(
    () => manifest.entities.flatMap((entity) => calendarEventsForEntity(entity)),
    [manifest.entities],
  );

  if (
    !isTimeZone(timeZone) ||
    (calendarDate !== undefined && !isCalendarDate(calendarDate)) ||
    (calendarMode !== "month" && calendarMode !== "day")
  ) {
    return (
      <div className="empty-state" role="alert">
        <h1>Invalid calendar address</h1>
        <p>
          Use a real date from 0100 through 9998, a month or day view, and a valid IANA time zone.
        </p>
        <Link to="/calendar">Open the current month</Link>
      </div>
    );
  }

  const date = calendarDate ?? dateAt(now, timeZone);
  const previous =
    calendarMode === "month" ? addCalendarMonths(date, -1) : addCalendarDays(date, -1);
  const next = calendarMode === "month" ? addCalendarMonths(date, 1) : addCalendarDays(date, 1);
  const zones = [
    ...new Set([
      timeZone,
      localZone,
      "UTC",
      ...events.flatMap((event) => (event.schedule.allDay ? [] : [event.schedule.timeZone])),
    ]),
  ].sort();
  const goToDate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("date");
    if (!(input instanceof HTMLInputElement)) throw new Error("Calendar date input is missing");
    if (!isCalendarDate(input.value)) {
      input.setCustomValidity("Enter a real date from 0100 through 9998.");
      input.reportValidity();
      return;
    }
    navigate(calendarHref(calendarMode, input.value, timeZone).slice(1));
  };
  const model = { date, timeZone, events };
  return (
    <div className="calendar-page">
      <header className="calendar-page__intro">
        <p className="eyebrow">Your time, in context</p>
        <h1>Calendar</h1>
        <p>Events, appointments, deadlines, and reminders from this audience's entity views.</p>
      </header>
      <div className="calendar-toolbar">
        <nav aria-label="Calendar views" className="calendar-view-switch">
          <a
            href={calendarHref("month", date, timeZone)}
            aria-current={calendarMode === "month" ? "page" : undefined}
          >
            Month
          </a>
          <a
            href={calendarHref("day", date, timeZone)}
            aria-current={calendarMode === "day" ? "page" : undefined}
          >
            Day
          </a>
        </nav>
        <nav aria-label="Calendar period" className="calendar-period">
          {previous ? (
            <a
              href={calendarHref(calendarMode, previous, timeZone)}
              aria-label={`Previous ${calendarMode}`}
            >
              Previous
            </a>
          ) : (
            <span>Previous</span>
          )}
          <button
            type="button"
            onClick={() => {
              const instant = Date.now();
              setNow(instant);
              navigate(calendarHref(calendarMode, dateAt(instant, timeZone), timeZone).slice(1));
            }}
          >
            Today
          </button>
          {next ? (
            <a
              href={calendarHref(calendarMode, next, timeZone)}
              aria-label={`Next ${calendarMode}`}
            >
              Next
            </a>
          ) : (
            <span>Next</span>
          )}
        </nav>
        <form key={date} onSubmit={goToDate} className="calendar-date-form">
          <label>
            Go to date
            <input
              name="date"
              type="date"
              min="0100-01-01"
              max="9998-12-31"
              required
              defaultValue={date}
              onInput={(event) => event.currentTarget.setCustomValidity("")}
            />
          </label>
          <button type="submit">Go</button>
        </form>
        <label className="calendar-zone">
          Time zone
          <select
            aria-label="Time zone"
            value={timeZone}
            onChange={(event) =>
              navigate(calendarHref(calendarMode, date, event.target.value).slice(1))
            }
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TimelineView {...model} title="Around this day" />
      {events.length === 0 ? (
        <aside className="calendar-page__empty">
          <h2>No calendar events yet</h2>
          <p>
            Add an event entity with a structured schedule and the permitted <code>event</code>{" "}
            view. Existing research notes are not automatically treated as appointments.
          </p>
        </aside>
      ) : null}
      <div className="calendar-page__view">
        {calendarMode === "month" ? (
          <CalendarMonthView
            {...model}
            title={formatCalendarDate(date, { month: "long", year: "numeric" })}
          />
        ) : (
          <CalendarDayView {...model} title="Day at a glance" />
        )}
      </div>
    </div>
  );
}
