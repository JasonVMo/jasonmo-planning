import type { EventSchedule } from "./generated/types.ts";

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 100 && year <= 9998 && day >= 1 && day <= (days[month - 1] ?? 0);
}

export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false;
  // Intl also accepts numeric offsets; this contract requires a named IANA zone.
  if (!/^[A-Za-z][A-Za-z0-9._+-]*(?:\/[A-Za-z0-9._+-]+)*$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function isCalendarTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  return Boolean(
    match &&
    isCalendarDate(match[1]) &&
    Number(match[2]) < 24 &&
    Number(match[3]) < 60 &&
    Number(match[4]) < 60 &&
    Number(match[5] ?? 0) < 24 &&
    Number(match[6] ?? 0) < 60 &&
    Number.isFinite(Date.parse(value)),
  );
}

export function compareCalendarTimestamps(start: string, end: string): number {
  const seconds = (value: string) => Date.parse(value.replace(/\.\d+/, ""));
  const difference = seconds(start) - seconds(end);
  if (difference !== 0) return difference;
  // Preserve Timestamp's arbitrary fractional precision rather than rounding to milliseconds.
  const fraction = (value: string) => /\.(\d+)/.exec(value)?.[1] ?? "";
  const left = fraction(start);
  const right = fraction(end);
  const length = Math.max(left.length, right.length);
  const paddedLeft = left.padEnd(length, "0");
  const paddedRight = right.padEnd(length, "0");
  return paddedLeft < paddedRight ? -1 : paddedLeft > paddedRight ? 1 : 0;
}

function dateInTimeZone(timestamp: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
}

export function calendarStart(schedule: EventSchedule): { date: string; timeZone: string } {
  return schedule.allDay
    ? { date: schedule.startDate, timeZone: "UTC" }
    : {
        date: dateInTimeZone(schedule.startAt, schedule.timeZone),
        timeZone: schedule.timeZone,
      };
}

export function eventScheduleRangeError(
  value: unknown,
): { field: string; message: string } | undefined {
  if (!value || typeof value !== "object") return;
  const schedule = value as Record<string, unknown>;
  if (
    schedule.allDay === true &&
    typeof schedule.startDate === "string" &&
    typeof schedule.endDate === "string" &&
    isCalendarDate(schedule.startDate) &&
    isCalendarDate(schedule.endDate) &&
    schedule.endDate <= schedule.startDate
  )
    return { field: "/endDate", message: "exclusive endDate must be after startDate" };
  if (
    schedule.allDay === false &&
    typeof schedule.startAt === "string" &&
    typeof schedule.endAt === "string" &&
    isCalendarTimestamp(schedule.startAt) &&
    isCalendarTimestamp(schedule.endAt)
  ) {
    if (compareCalendarTimestamps(schedule.startAt, schedule.endAt) >= 0)
      return { field: "/endAt", message: "exclusive endAt must be after startAt" };
    if (isTimeZone(schedule.timeZone))
      for (const field of ["startAt", "endAt"] as const)
        if (!isCalendarDate(dateInTimeZone(schedule[field] as string, schedule.timeZone)))
          return {
            field: `/${field}`,
            message: "event date in its timeZone must be within years 0100..9998",
          };
  }
}

export function isEventSchedule(value: unknown): value is EventSchedule {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const schedule = value as Record<string, unknown>;
  const fields =
    schedule.allDay === true
      ? ["allDay", "startDate", "endDate"]
      : ["allDay", "startAt", "endAt", "timeZone"];
  if (
    fields.some((field) => !Object.hasOwn(schedule, field)) ||
    Reflect.ownKeys(schedule).some((field) => typeof field !== "string" || !fields.includes(field))
  )
    return false;
  const validFields =
    schedule.allDay === true
      ? isCalendarDate(schedule.startDate) && isCalendarDate(schedule.endDate)
      : schedule.allDay === false &&
        isCalendarTimestamp(schedule.startAt) &&
        isCalendarTimestamp(schedule.endAt) &&
        isTimeZone(schedule.timeZone);
  return validFields && !eventScheduleRangeError(schedule);
}
