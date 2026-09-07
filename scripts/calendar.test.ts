import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "../packages/entity-model/src/index.ts";
import {
  addCalendarDays,
  addCalendarMonths,
  dateAt,
  eventDateRange,
  eventTime,
  eventsOnDate,
  hasTimeConflict,
} from "../packages/entity-ui/src/calendar.ts";
import { parseSiteManifest } from "../apps/site/src/manifest.ts";
import {
  appointment,
  calendarManifest,
  calendarEvents,
} from "../apps/storybook/fixtures/calendar.ts";

function timed(startAt: string, endAt: string): CalendarEvent {
  return {
    ...appointment,
    schedule: { allDay: false, startAt, endAt, timeZone: "America/Los_Angeles" },
  };
}

describe("calendar navigation and date membership", () => {
  it("clamps month navigation and handles leap/year boundaries", () => {
    expect(addCalendarMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addCalendarMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addCalendarMonths("2026-12-07", 1)).toBe("2027-01-07");
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addCalendarDays("0100-01-01", -1)).toBeNull();
    expect(addCalendarMonths("9998-12-31", 1)).toBeNull();
  });

  it("keeps all-day dates zone-independent and the end exclusive", () => {
    const events = calendarEvents.filter((event) => event.schedule.allDay);
    for (const zone of ["America/Los_Angeles", "Asia/Tokyo", "UTC"]) {
      expect(eventsOnDate(events, "2026-09-07", zone)).toHaveLength(1);
      expect(eventsOnDate(events, "2026-09-08", zone)).toHaveLength(1);
      expect(eventsOnDate(events, "2026-09-09", zone)).toHaveLength(0);
    }
  });

  it("includes overnight events but excludes an event ending exactly at midnight", () => {
    const event = timed("2026-09-06T23:00:00-07:00", "2026-09-07T00:00:00-07:00");
    expect(eventsOnDate([event], "2026-09-06", "America/Los_Angeles")).toHaveLength(1);
    expect(eventsOnDate([event], "2026-09-07", "America/Los_Angeles")).toHaveLength(0);
    expect(eventsOnDate(calendarEvents, "2026-09-07", "America/Los_Angeles")).toHaveLength(6);
  });

  it("uses real instants across DST and viewer time zones", () => {
    const event = timed("2026-03-08T01:30:00-08:00", "2026-03-08T03:30:00-07:00");
    expect(eventsOnDate([event], "2026-03-08", "America/Los_Angeles")).toHaveLength(1);
    expect(dateAt("2026-09-07T23:30:00-07:00", "UTC")).toBe("2026-09-08");
    const repeated = timed("2026-11-01T01:30:00-07:00", "2026-11-01T01:30:00-08:00");
    expect(eventsOnDate([repeated], "2026-11-01", "America/Los_Angeles")).toHaveLength(1);
  });

  it("handles historical midnight rollbacks and skipped local dates", () => {
    const reversed = timed("2008-11-02T03:00:00Z", "2008-11-02T03:30:00Z");
    const sameEndpoints = timed("2008-11-02T02:30:00Z", "2008-11-02T03:30:00Z");
    for (const event of [reversed, sameEndpoints]) {
      expect(eventsOnDate([event], "2008-11-01", "America/Goose_Bay")).toHaveLength(1);
      expect(eventsOnDate([event], "2008-11-02", "America/Goose_Bay")).toHaveLength(1);
    }
    const skipped = timed("2011-12-29T00:00:00Z", "2012-01-01T00:00:00Z");
    expect(eventsOnDate([skipped], "2011-12-30", "Pacific/Apia")).toHaveLength(0);
  });

  it("disambiguates repeated clock hours and labels midnight end dates", () => {
    const repeated = timed("2026-11-01T01:30:00-07:00", "2026-11-01T01:30:00-08:00");
    expect(eventTime(repeated, "America/Los_Angeles")).toBe("1:30 AM PDT - 1:30 AM PST");
    const midnight = timed("2026-09-06T23:00:00-07:00", "2026-09-07T00:00:00-07:00");
    expect(eventDateRange(midnight, "America/Los_Angeles")).toBe("Sep 6, 2026 - Sep 7, 2026");
  });

  it("sorts chronologically by instants rather than timestamp spelling", () => {
    const earlier = {
      ...timed("2026-09-07T15:00:00Z", "2026-09-07T16:00:00Z"),
      href: "#/entities/earlier",
    };
    expect(
      eventsOnDate([appointment, earlier], "2026-09-07", "UTC").map((event) => event.href),
    ).toEqual([earlier.href, appointment.href]);
  });

  it("flags overlaps but not adjacent or cancelled appointments", () => {
    const adjacent = {
      ...timed("2026-09-07T10:30:00-07:00", "2026-09-07T11:00:00-07:00"),
      href: "#/entities/adjacent",
    };
    expect(hasTimeConflict(appointment, calendarEvents)).toBe(true);
    expect(hasTimeConflict(appointment, [appointment, adjacent])).toBe(false);
    expect(hasTimeConflict({ ...appointment, status: "cancelled" }, calendarEvents)).toBe(false);
  });

  it("retains sub-millisecond midnight events, ordering, and conflicts", () => {
    const early = timed("2026-09-07T00:00:00.0001Z", "2026-09-07T00:00:00.0003Z");
    const later = {
      ...timed("2026-09-07T00:00:00.0002Z", "2026-09-07T00:00:00.0004Z"),
      href: "#/entities/later",
    };
    expect(eventsOnDate([later, early], "2026-09-07", "UTC")).toEqual([early, later]);
    expect(eventsOnDate([early], "2026-09-06", "UTC")).toHaveLength(0);
    expect(hasTimeConflict(early, [early, later])).toBe(true);
  });
});

describe("browser calendar contract", () => {
  it("accepts the synthetic projection and all registered calendar models", () => {
    expect(parseSiteManifest(calendarManifest)).toEqual(calendarManifest);
  });

  it.each([
    { allDay: true, startDate: "2026-02-30", endDate: "2026-03-01" },
    { allDay: true, startDate: "2026-09-07", endDate: "2026-09-07" },
    {
      allDay: false,
      startAt: "2026-09-07T09:00:00",
      endAt: "2026-09-07T10:00:00",
      timeZone: "UTC",
    },
    {
      allDay: false,
      startAt: "2026-09-07T09:00:00Z",
      endAt: "2026-09-07T10:00:00Z",
      timeZone: "Not/AZone",
    },
  ])("rejects invalid schedules before rendering: %j", (schedule) => {
    const invalid = structuredClone(calendarManifest);
    const entity = invalid.entities[0]!;
    expect(() =>
      parseSiteManifest({
        ...invalid,
        entities: [{ ...entity, viewModels: { event: { ...appointment, schedule } } }],
      }),
    ).toThrow("browser-safe");
  });
});
