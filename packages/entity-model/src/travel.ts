import type { FlightLegs, TripChildRole } from "./generated/types.ts";
import {
  compareCalendarTimestamps,
  calendarStart,
  eventScheduleRangeError,
  isCalendarDate,
  isCalendarTimestamp,
  isTimeZone,
} from "./calendar.ts";

type RangeError = { field: string; message: string } | undefined;

export const TRIP_CHILD_ROLES = [
  "segment",
  "flight",
  "reservation",
  "things-to-do",
  "hikes-walks",
  "restaurants",
  "getting-ready",
] as const satisfies readonly TripChildRole[];

export function exclusiveTripEnd(endDate: string): string {
  if (!isCalendarDate(endDate)) throw new Error("Invalid trip endDate");
  const date = new Date(`${endDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  const result = date.toISOString().slice(0, 10);
  if (!isCalendarDate(result)) throw new Error("Trip exclusive end exceeds calendar date range");
  return result;
}

export function tripRangeError(value: unknown): RangeError {
  if (!value || typeof value !== "object") return;
  const trip = value as Record<string, unknown>;
  if (!isCalendarDate(trip.startDate) || !isCalendarDate(trip.endDate)) return;
  if (trip.endDate < trip.startDate)
    return { field: "/endDate", message: "inclusive endDate must be on or after startDate" };
  if (trip.endDate === "9998-12-31")
    return {
      field: "/endDate",
      message: "exclusive calendar end must remain within years 0100..9998",
    };
}

export function flightLegOrderError(value: unknown): RangeError {
  if (!Array.isArray(value)) return;
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") continue;
    const leg = item as Record<string, unknown>;
    for (const [field, zoneField] of [
      ["departAt", "departureTimeZone"],
      ["arriveAt", "arrivalTimeZone"],
    ] as const) {
      const timestamp = leg[field];
      const timeZone = leg[zoneField];
      if (
        isCalendarTimestamp(timestamp) &&
        isTimeZone(timeZone) &&
        !isCalendarDate(
          calendarStart({
            allDay: false,
            startAt: timestamp,
            endAt: timestamp,
            timeZone,
          }).date,
        )
      )
        return {
          field: `/${index}/${field}`,
          message: "flight date in its timeZone must be within years 0100..9998",
        };
    }
    if (isCalendarTimestamp(leg.departAt) && isCalendarTimestamp(leg.arriveAt)) {
      if (compareCalendarTimestamps(leg.departAt, leg.arriveAt) >= 0)
        return { field: `/${index}/arriveAt`, message: "arrival must be after departure" };
      const previous = value[index - 1] as Record<string, unknown> | undefined;
      if (
        previous &&
        isCalendarTimestamp(previous.arriveAt) &&
        compareCalendarTimestamps(previous.arriveAt, leg.departAt) > 0
      )
        return {
          field: `/${index}/departAt`,
          message: "flight legs must be chronological and non-overlapping",
        };
    }
  }
  const first = value[0] as Record<string, unknown> | undefined;
  const last = value.at(-1) as Record<string, unknown> | undefined;
  if (first && last) {
    const error = eventScheduleRangeError({
      allDay: false,
      startAt: first.departAt,
      endAt: last.arriveAt,
      timeZone: first.departureTimeZone,
    });
    if (error)
      return {
        field: error.field === "/startAt" ? "/0/departAt" : `/${value.length - 1}/arriveAt`,
        message: error.message,
      };
  }
}

export function isTravelText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 500 &&
    !/[<>]/.test(value) &&
    [...value].every((char) => char.charCodeAt(0) >= 32 || "\r\n\t".includes(char))
  );
}

export function isFlightLegs(value: unknown): value is FlightLegs {
  const fields = [
    "carrier",
    "flightNumber",
    "origin",
    "destination",
    "departAt",
    "departureTimeZone",
    "arriveAt",
    "arrivalTimeZone",
  ];
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 32 &&
    Array.from(value).every((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const leg = item as Record<string, unknown>;
      return (
        fields.every((field) => Object.hasOwn(leg, field)) &&
        Reflect.ownKeys(leg).every(
          (field) => typeof field === "string" && fields.includes(field),
        ) &&
        isTravelText(leg.carrier) &&
        isTravelText(leg.flightNumber) &&
        isTravelText(leg.origin) &&
        isTravelText(leg.destination) &&
        isCalendarTimestamp(leg.departAt) &&
        isTimeZone(leg.departureTimeZone) &&
        isCalendarTimestamp(leg.arriveAt) &&
        isTimeZone(leg.arrivalTimeZone)
      );
    }) &&
    !flightLegOrderError(value)
  );
}

export function orderedChildrenError(value: unknown): RangeError {
  if (!Array.isArray(value)) return;
  let previous = -1;
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") continue;
    const order = (item as Record<string, unknown>).order;
    if (typeof order !== "number") continue;
    if (order <= previous)
      return {
        field: `/${index}/order`,
        message: "projected child order must be unique and increasing",
      };
    previous = order;
  }
}
