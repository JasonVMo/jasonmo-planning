import {
  compareCalendarTimestamps,
  isCalendarDate,
  type CalendarEvent,
} from "@tracker/entity-model";

export function dateAt(instant: number | string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
}

export function addCalendarDays(date: string, days: number): string | null {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  const result = value.toISOString().slice(0, 10);
  return isCalendarDate(result) ? result : null;
}

export function addCalendarMonths(date: string, months: number): string | null {
  const value = new Date(`${date}T12:00:00Z`);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + months);
  const end = new Date(value);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  value.setUTCDate(Math.min(day, end.getUTCDate()));
  const result = value.toISOString().slice(0, 10);
  return isCalendarDate(result) ? result : null;
}

export function formatCalendarDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  },
): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

export function calendarHref(mode: "month" | "day", date: string, timeZone: string): string {
  return `#/calendar/${mode}/${date}?timeZone=${encodeURIComponent(timeZone)}`;
}

export function eventStartDate(event: CalendarEvent, timeZone: string): string {
  return event.schedule.allDay
    ? event.schedule.startDate
    : dateAt(event.schedule.startAt, timeZone);
}

function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  if (a.schedule.allDay !== b.schedule.allDay) return a.schedule.allDay ? -1 : 1;
  const startA = a.schedule.allDay ? a.schedule.startDate : a.schedule.startAt;
  const startB = b.schedule.allDay ? b.schedule.startDate : b.schedule.startAt;
  return (
    (a.schedule.allDay
      ? startA.localeCompare(startB, "en")
      : compareCalendarTimestamps(startA, startB)) ||
    a.title.localeCompare(b.title, "en") ||
    a.href.localeCompare(b.href, "en")
  );
}

function compareTimestampToMillis(timestamp: string, millis: number): number {
  const difference = Date.parse(timestamp) - millis;
  if (difference !== 0) return difference;
  return /[1-9]/.test((/\.(\d+)/.exec(timestamp)?.[1] ?? "").slice(3)) ? 1 : 0;
}

export function eventLastDate(event: CalendarEvent, timeZone: string): string {
  if (event.schedule.allDay) return addCalendarDays(event.schedule.endDate, -1)!;
  const end = Date.parse(event.schedule.endAt);
  return dateAt(compareTimestampToMillis(event.schedule.endAt, end) > 0 ? end : end - 1, timeZone);
}

function dayIntervals(date: string, timeZone: string): [number, number][] {
  const midnight = Date.parse(`${date}T00:00:00Z`);
  const day = 86_400_000;
  const step = 6 * 3_600_000;
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" });
  const offsetAt = (instant: number) => {
    const zone = formatter
      .formatToParts(instant)
      .find((part) => part.type === "timeZoneName")?.value;
    if (zone === "GMT") return 0;
    const match = /^GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(zone ?? "");
    if (!match) throw new Error(`Unsupported time-zone offset: ${zone}`);
    return (
      (match[1] === "-" ? -1 : 1) *
      (Number(match[2]) * 3600 + Number(match[3]) * 60 + Number(match[4] ?? 0)) *
      1000
    );
  };
  const intervals: [number, number][] = [];
  const append = (start: number, end: number, offset: number) => {
    const first = Math.max(start, midnight - offset);
    const last = Math.min(end, midnight + day - offset);
    if (first < last) intervals.push([first, last]);
  };
  let segmentStart = midnight - 2 * day;
  let offset = offsetAt(segmentStart);
  // Split around IANA offset transitions, including historical midnight rollbacks.
  // Six-hour probes bracket transitions; bisection retains second-level historical offsets.
  for (let probe = segmentStart + step; probe <= midnight + 3 * day; probe += step) {
    const nextOffset = offsetAt(probe);
    if (nextOffset !== offset) {
      let low = probe - step;
      let high = probe;
      while (high - low > 1) {
        const middle = Math.floor((low + high) / 2);
        if (offsetAt(middle) === offset) low = middle;
        else high = middle;
      }
      append(segmentStart, high, offset);
      segmentStart = high;
      offset = nextOffset;
    }
  }
  append(segmentStart, midnight + 3 * day, offset);
  return intervals;
}

export function eventsByDate(
  events: readonly CalendarEvent[],
  dates: readonly string[],
  timeZone: string,
): Map<string, CalendarEvent[]> {
  const result = new Map<string, CalendarEvent[]>(dates.map((date) => [date, []]));
  const intervals = events.some((event) => !event.schedule.allDay)
    ? new Map(dates.map((date) => [date, dayIntervals(date, timeZone)]))
    : new Map<string, [number, number][]>();
  for (const event of [...events].sort(compareEvents)) {
    const { schedule } = event;
    for (const [date, items] of result) {
      const included = schedule.allDay
        ? schedule.startDate <= date && schedule.endDate > date
        : intervals
            .get(date)!
            .some(
              ([first, last]) =>
                compareTimestampToMillis(schedule.startAt, last) < 0 &&
                compareTimestampToMillis(schedule.endAt, first) > 0,
            );
      if (included) items.push(event);
    }
  }
  return result;
}

export function eventsOnDate(
  events: readonly CalendarEvent[],
  date: string,
  timeZone: string,
): CalendarEvent[] {
  return eventsByDate(events, [date], timeZone).get(date)!;
}

export function eventTime(event: CalendarEvent, timeZone: string): string {
  if (event.schedule.allDay) return "All day";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  const zoneFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const start = new Date(event.schedule.startAt);
  const end = new Date(event.schedule.endAt);
  const startZone = zoneFormatter
    .formatToParts(start)
    .find((part) => part.type === "timeZoneName")?.value;
  const endZone = zoneFormatter
    .formatToParts(end)
    .find((part) => part.type === "timeZoneName")?.value;
  if (startZone !== endZone) return `${zoneFormatter.format(start)} - ${zoneFormatter.format(end)}`;
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function eventDateRange(event: CalendarEvent, timeZone: string): string {
  const schedule = event.schedule;
  const first = eventStartDate(event, timeZone);
  const last = schedule.allDay
    ? addCalendarDays(schedule.endDate, -1)!
    : dateAt(schedule.endAt, timeZone);
  const shortDate = (date: string) =>
    formatCalendarDate(date, { month: "short", day: "numeric", year: "numeric" });
  return first === last ? shortDate(first) : `${shortDate(first)} - ${shortDate(last)}`;
}

export function hasTimeConflict(event: CalendarEvent, events: readonly CalendarEvent[]): boolean {
  const schedule = event.schedule;
  if (schedule.allDay || event.status === "cancelled") return false;
  return events.some((other) => {
    const candidate = other.schedule;
    return (
      other.href !== event.href &&
      other.status !== "cancelled" &&
      !candidate.allDay &&
      compareCalendarTimestamps(schedule.startAt, candidate.endAt) < 0 &&
      compareCalendarTimestamps(candidate.startAt, schedule.endAt) < 0
    );
  });
}
