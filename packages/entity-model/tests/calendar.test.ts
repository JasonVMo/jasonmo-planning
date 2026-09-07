import { describe, expect, it } from "vitest";
import { isCalendarDate, isEventSchedule, isTimeZone, type EventSchedule } from "../src/index.ts";

const allDay: EventSchedule = {
  allDay: true,
  startDate: "2026-09-07",
  endDate: "2026-09-08",
};
const timed: EventSchedule = {
  allDay: false,
  startAt: "2026-11-01T01:30:00-07:00",
  endAt: "2026-11-01T01:30:00-08:00",
  timeZone: "America/Los_Angeles",
};

describe("browser-safe calendar guards", () => {
  it.each([null, undefined, false, 20260907, [], {}, new Date("2026-09-07T00:00:00Z")])(
    "rejects non-string scalar input %j without coercion",
    (value) => {
      expect(isCalendarDate(value)).toBe(false);
      expect(isTimeZone(value)).toBe(false);
    },
  );
  it.each(["0100-01-01", "2000-02-29", "2024-02-29", "9998-12-31"])(
    "accepts supported Gregorian dates %s",
    (value) => expect(isCalendarDate(value)).toBe(true),
  );
  it.each(["0099-12-31", "9999-01-01", "1900-02-29", "2026-02-30", "2026-1-01", "2026-09-07\n"])(
    "rejects malformed, impossible or out-of-range dates %s",
    (value) => expect(isCalendarDate(value)).toBe(false),
  );
  it.each(["UTC", "America/Los_Angeles", "Asia/Kathmandu", "Etc/GMT+1"])(
    "accepts a named IANA zone %s",
    (value) => expect(isTimeZone(value)).toBe(true),
  );
  it.each(["", "+01:00", "-07:00", "Mars/Olympus", "UTC\n"])(
    "rejects unnamed or invalid time zones %s",
    (value) => expect(isTimeZone(value)).toBe(false),
  );
  it.each([
    null,
    undefined,
    [],
    "event",
    {},
    { ...allDay, allDay: "true" },
    { ...allDay, timeZone: "UTC" },
    { ...allDay, body: "extra" },
    { ...allDay, endDate: allDay.startDate },
    { ...allDay, endDate: "2026-09-06" },
    { ...allDay, startDate: "2026-02-30" },
    { ...timed, endDate: "2026-09-08" },
    { ...timed, timeZone: "+01:00" },
    { ...timed, startAt: "2026-02-30T01:30:00Z" },
    { ...timed, startAt: "2026-11-01T01:30:00" },
    { ...timed, endAt: "2026-11-01T08:30:00Z" },
    { ...timed, endAt: "2026-11-01T08:00:00Z" },
    { ...timed, startAt: "2026-11-01T25:00:00Z" },
    { ...timed, startAt: "2026-11-01T01:30:00+24:00" },
  ])("rejects malformed schedules and nonpositive instant ranges %j", (value) => {
    expect(isEventSchedule(value)).toBe(false);
  });
  it("requires precisely the variant's own fields", () => {
    for (const schedule of [allDay, timed]) {
      expect(isEventSchedule(schedule)).toBe(true);
      for (const field of Object.keys(schedule)) {
        const candidate = { ...schedule } as Record<string, unknown>;
        delete candidate[field];
        expect(isEventSchedule(candidate)).toBe(false);
      }
    }
    expect(isEventSchedule(Object.create(allDay))).toBe(false);
    expect(isEventSchedule({ ...allDay, [Symbol("extra")]: true })).toBe(false);
  });
  it("retains fractional precision and checks endpoint years in the declared zone", () => {
    expect(
      isEventSchedule({
        ...timed,
        startAt: "2026-09-07T12:00:00.0001Z",
        endAt: "2026-09-07T12:00:00.0002Z",
      }),
    ).toBe(true);
    expect(
      isEventSchedule({
        ...timed,
        startAt: "0100-01-01T00:00:00Z",
        endAt: "0100-01-01T01:00:00Z",
        timeZone: "Etc/GMT+1",
      }),
    ).toBe(false);
  });
});
