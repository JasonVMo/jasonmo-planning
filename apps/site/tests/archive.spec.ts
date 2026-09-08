import { expect, test } from "@playwright/test";
import type {
  CalendarEvent,
  EventSchedule,
  SiteEntity,
  TripViewModel,
} from "@planning/entity-model";
import {
  ARCHIVE_GRACE_DAYS,
  ARCHIVE_TIME_ZONE,
  archiveThresholdDate,
  calendarEventsForEntity,
  eventEffectiveEndDate,
  isArchivedAsOf,
  isEntityArchived,
  isPossibleNeedsBookingReservation,
  isRootTrip,
  tripAncestryOf,
  tripEffectiveEndDate,
} from "../src/archive.ts";

function trip(overrides: Partial<TripViewModel> = {}): TripViewModel {
  return {
    title: "Synthetic trip",
    summary: "A synthetic trip for unit coverage.",
    href: "#/entities/synthetic-trip",
    kind: "trip",
    status: "confirmed",
    startDate: "2026-10-05",
    endDate: "2026-10-13",
    destination: "Example Coast",
    timeZone: "America/Los_Angeles",
    body: "",
    children: [],
    ...overrides,
  };
}

function entity(overrides: Partial<SiteEntity> = {}): SiteEntity {
  return {
    id: "synthetic",
    dataType: "markdown",
    dataVersion: 1,
    title: "Synthetic entity",
    summary: "Synthetic",
    route: "#/entities/synthetic",
    primaryTopicId: "synthetic-topic",
    tags: [],
    relationships: [],
    citations: [],
    view: {
      defaultType: "full",
      byContext: {
        navigation: "label",
        collection: "card",
        relationship: "tile",
        search: "label",
        detail: "full",
      },
    },
    viewModels: {},
    ...overrides,
  };
}

test("ARCHIVE_GRACE_DAYS is five weeks and ARCHIVE_TIME_ZONE is Los Angeles", () => {
  expect(ARCHIVE_GRACE_DAYS).toBe(35);
  expect(ARCHIVE_TIME_ZONE).toBe("America/Los_Angeles");
});

test("isRootTrip distinguishes a root trip from a segment", () => {
  expect(isRootTrip(trip({ kind: "trip" }))).toBe(true);
  expect(isRootTrip(trip({ kind: "segment" }))).toBe(false);
});

test("tripEffectiveEndDate is the inclusive TripViewModel.endDate unchanged", () => {
  expect(tripEffectiveEndDate(trip({ endDate: "2026-09-20" }))).toBe("2026-09-20");
});

test("eventEffectiveEndDate resolves the previous day for an exclusive all-day end", () => {
  const schedule: EventSchedule = { allDay: true, startDate: "2026-09-15", endDate: "2026-09-21" };
  expect(eventEffectiveEndDate(schedule)).toBe("2026-09-20");
});

test("eventEffectiveEndDate resolves a timed end instant to its own time-zone calendar date", () => {
  // 2026-09-20T23:30-07:00 is still September 20 in Los Angeles but September 21 in UTC.
  const schedule: EventSchedule = {
    allDay: false,
    startAt: "2026-09-20T20:00:00-07:00",
    endAt: "2026-09-20T23:30:00-07:00",
    timeZone: "America/Los_Angeles",
  };
  expect(eventEffectiveEndDate(schedule)).toBe("2026-09-20");
});

test("archiveThresholdDate is exactly 35 calendar days after the effective end date", () => {
  expect(archiveThresholdDate("2026-09-20")).toBe("2026-10-25");
});

test("isArchivedAsOf is false the day before the threshold and true on the threshold day", () => {
  const effectiveEndDate = "2026-09-20";
  const threshold = archiveThresholdDate(effectiveEndDate);
  expect(threshold).toBe("2026-10-25");
  expect(isArchivedAsOf(effectiveEndDate, "2026-10-24T23:59:00-07:00")).toBe(false);
  expect(isArchivedAsOf(effectiveEndDate, "2026-10-25T00:00:01-07:00")).toBe(true);
});

test("isArchivedAsOf evaluates the boundary in America/Los_Angeles, not UTC", () => {
  const effectiveEndDate = "2026-09-20";
  // 2026-10-25T06:00:00Z is still 2026-10-24 in Los Angeles (UTC-7 in October), so not yet archived.
  expect(isArchivedAsOf(effectiveEndDate, "2026-10-25T06:00:00Z")).toBe(false);
  // 2026-10-25T07:00:00Z is 2026-10-25T00:00:00-07:00 in Los Angeles: archived.
  expect(isArchivedAsOf(effectiveEndDate, "2026-10-25T07:00:00Z")).toBe(true);
});

test("isArchivedAsOf accepts a Date, an epoch instant, or a string clock", () => {
  const effectiveEndDate = "2026-09-20";
  const archivedInstant = Date.parse("2026-11-01T00:00:00-07:00");
  expect(isArchivedAsOf(effectiveEndDate, new Date(archivedInstant))).toBe(true);
  expect(isArchivedAsOf(effectiveEndDate, archivedInstant)).toBe(true);
  expect(isArchivedAsOf(effectiveEndDate, "2026-11-01T00:00:00-07:00")).toBe(true);
});

test("isEntityArchived honors an explicit archived lifecycle before the date threshold", () => {
  const asOf = "2026-09-21T12:00:00-07:00";
  expect(isEntityArchived(entity({ lifecycle: "archived" }), "2026-09-20", asOf)).toBe(true);
  expect(isEntityArchived(entity({ lifecycle: "active" }), "2026-09-20", asOf)).toBe(false);
});

test("tripAncestryOf returns an empty chain for a root trip", () => {
  const root = entity({
    id: "root",
    dataType: "trip",
    route: "#/entities/root",
    viewModels: { trip: trip({ href: "#/entities/root", children: [] }) },
  });
  expect(tripAncestryOf([root], "#/entities/root")).toEqual([]);
});

test("tripAncestryOf returns [root] for a direct segment child", () => {
  const root = entity({
    id: "root",
    dataType: "trip",
    route: "#/entities/root",
    viewModels: {
      trip: trip({
        href: "#/entities/root",
        children: [
          { title: "Segment", summary: "s", href: "#/entities/segment", role: "segment", order: 0 },
        ],
      }),
    },
  });
  const segment = entity({ id: "segment", dataType: "trip", route: "#/entities/segment" });
  const chain = tripAncestryOf([root, segment], "#/entities/segment");
  expect(chain.map((item) => item.id)).toEqual(["root"]);
});

test("tripAncestryOf returns [root, segment] for a reservation attached to a segment", () => {
  const root = entity({
    id: "root",
    dataType: "trip",
    route: "#/entities/root",
    viewModels: {
      trip: trip({
        href: "#/entities/root",
        children: [
          { title: "Segment", summary: "s", href: "#/entities/segment", role: "segment", order: 0 },
        ],
      }),
    },
  });
  const segment = entity({
    id: "segment",
    dataType: "trip",
    route: "#/entities/segment",
    viewModels: {
      trip: trip({
        kind: "segment",
        href: "#/entities/segment",
        children: [
          {
            title: "Lodging",
            summary: "s",
            href: "#/entities/lodging",
            role: "reservation",
            order: 0,
          },
        ],
      }),
    },
  });
  const lodging = entity({ id: "lodging", dataType: "reservation", route: "#/entities/lodging" });
  const chain = tripAncestryOf([root, segment, lodging], "#/entities/lodging");
  expect(chain.map((item) => item.id)).toEqual(["root", "segment"]);
});

function calendarStub(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    title: "Event",
    summary: "Summary",
    href: "#/entities/event",
    kind: "event",
    status: "confirmed",
    schedule: { allDay: true, startDate: "2026-09-15", endDate: "2026-09-16" },
    ...overrides,
  };
}

test("calendarEventsForEntity returns the projected event model for a standalone event", () => {
  const event = entity({
    id: "event",
    dataType: "event",
    viewModels: { event: { ...calendarStub(), body: "" } },
  });
  expect(calendarEventsForEntity(event)).toEqual([calendarStub()]);
});

test("calendarEventsForEntity includes a root trip's own span", () => {
  const root = entity({
    id: "root",
    dataType: "trip",
    viewModels: {
      trip: trip(),
      event: { ...calendarStub({ title: "Synthetic trip" }), body: "" },
    },
  });
  expect(calendarEventsForEntity(root)).toEqual([calendarStub({ title: "Synthetic trip" })]);
});

test("calendarEventsForEntity excludes a segment's span to avoid duplicating the root trip span", () => {
  const segment = entity({
    id: "segment",
    dataType: "trip",
    viewModels: {
      trip: trip({ kind: "segment" }),
      event: { ...calendarStub(), body: "" },
    },
  });
  expect(calendarEventsForEntity(segment)).toEqual([]);
});

test("calendarEventsForEntity returns nothing for an entity without a projected event", () => {
  expect(calendarEventsForEntity(entity({ dataType: "markdown" }))).toEqual([]);
});

test("isPossibleNeedsBookingReservation requires the public-safe needs-booking tag", () => {
  const needsBooking = entity({ dataType: "reservation", tags: ["needs-booking"] });
  const booked = entity({
    dataType: "reservation",
    tags: ["confirmed"],
  });
  const nonReservation = entity({
    dataType: "event",
    tags: ["needs-booking"],
  });
  expect(isPossibleNeedsBookingReservation(needsBooking)).toBe(true);
  expect(isPossibleNeedsBookingReservation(booked)).toBe(false);
  expect(isPossibleNeedsBookingReservation(nonReservation)).toBe(false);
});
