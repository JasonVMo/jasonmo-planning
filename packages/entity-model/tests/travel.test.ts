import { describe, expect, it } from "vitest";
import {
  exclusiveTripEnd,
  tripRangeError,
  flightLegOrderError,
  isFlightLegs,
  orderedChildrenError,
  type FlightLeg,
} from "../src/index.ts";

const leg: FlightLeg = {
  carrier: "Example Air",
  flightNumber: "EX 101",
  origin: "AAA",
  destination: "BBB",
  departAt: "2026-11-01T01:30:00-07:00",
  departureTimeZone: "America/Los_Angeles",
  arriveAt: "2026-11-01T01:30:00-08:00",
  arrivalTimeZone: "America/Los_Angeles",
};

describe("travel calendar semantics", () => {
  it.each([
    ["2024-02-28", "2024-02-29"],
    ["2024-02-29", "2024-03-01"],
    ["2026-12-31", "2027-01-01"],
    ["0100-01-01", "0100-01-02"],
  ])("converts inclusive %s to exclusive %s without local-time arithmetic", (date, end) => {
    expect(exclusiveTripEnd(date)).toBe(end);
    expect(tripRangeError({ startDate: date, endDate: date })).toBeUndefined();
  });
  it("rejects reversed dates and non-projectable calendar endpoints", () => {
    expect(tripRangeError({ startDate: "2026-01-02", endDate: "2026-01-01" })?.field).toBe(
      "/endDate",
    );
    expect(tripRangeError({ startDate: "9998-12-30", endDate: "9998-12-31" })?.field).toBe(
      "/endDate",
    );
    expect(() => exclusiveTripEnd("9998-12-31")).toThrow();
    expect(() => exclusiveTripEnd("2026-02-30")).toThrow();
  });
  it("compares offset instants, including a daylight-saving fallback and touching legs", () => {
    expect(isFlightLegs([leg])).toBe(true);
    expect(
      isFlightLegs([leg, { ...leg, departAt: leg.arriveAt, arriveAt: "2026-11-01T12:00:00Z" }]),
    ).toBe(true);
    expect(flightLegOrderError([leg, leg])?.field).toBe("/1/departAt");
    expect(flightLegOrderError([{ ...leg, arriveAt: leg.departAt }])?.field).toBe("/0/arriveAt");
  });
  it("preserves sub-millisecond chronological ordering", () => {
    expect(
      isFlightLegs([
        { ...leg, departAt: "2026-01-01T00:00:00.0001Z", arriveAt: "2026-01-01T00:00:00.0002Z" },
      ]),
    ).toBe(true);
    expect(
      isFlightLegs([
        { ...leg, departAt: "2026-01-01T00:00:00.0002Z", arriveAt: "2026-01-01T00:00:00.0001Z" },
      ]),
    ).toBe(false);
  });
  it("keeps airport-local and aggregate calendar endpoints in the supported year range", () => {
    const ancient = {
      ...leg,
      departAt: "0100-01-01T00:00:00Z",
      arriveAt: "0100-01-01T02:00:00Z",
      departureTimeZone: "Etc/GMT+1",
      arrivalTimeZone: "UTC",
    };
    expect(isFlightLegs([ancient])).toBe(false);
    expect(flightLegOrderError([ancient])?.field).toBe("/0/departAt");
    expect(isFlightLegs([{ ...ancient, departureTimeZone: "UTC" }])).toBe(true);
  });
  it.each([
    { legs: [] },
    { legs: [{ ...leg, bookingLocator: "forbidden" }] },
    { legs: [{ ...leg, carrier: "<b>Air</b>" }] },
    { legs: [{ ...leg, departureTimeZone: "Mars/Port" }] },
    { legs: [{ ...leg, departAt: "2026-11-01T01:30:00" }] },
  ])("rejects incomplete, executable, private, or invalid leg data", ({ legs }) => {
    expect(isFlightLegs(legs)).toBe(false);
  });
  it("requires strictly increasing projected child order", () => {
    expect(orderedChildrenError([{ order: 0 }, { order: 2 }])).toBeUndefined();
    expect(orderedChildrenError([{ order: 1 }, { order: 1 }])?.field).toBe("/1/order");
    expect(orderedChildrenError([{ order: 3 }, { order: 2 }])?.field).toBe("/1/order");
  });
});
