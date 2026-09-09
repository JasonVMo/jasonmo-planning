import { expect, test, type Page } from "@playwright/test";
import type {
  EventSchedule,
  EventViewModel,
  FlightViewModel,
  SiteEntity,
  SiteManifest,
  TripChildRole,
  TripViewModel,
} from "@planning/entity-model";

const TAXONOMY: SiteManifest["taxonomy"] = [
  { id: "trips", title: "Trips", description: "Upcoming travel.", order: 100 },
  { id: "events", title: "Events", description: "Dated interests.", order: 200 },
  {
    id: "seahawks-games",
    title: "Seahawks Games",
    description: "Selected games.",
    order: 210,
    parentId: "events",
  },
  {
    id: "concerts",
    title: "Concerts",
    description: "Upcoming concerts.",
    order: 220,
    parentId: "events",
  },
  {
    id: "productions",
    title: "Productions",
    description: "Plays and musicals.",
    order: 230,
    parentId: "events",
  },
  {
    id: "festivals-events",
    title: "Festivals & Events",
    description: "Other dated events.",
    order: 240,
    parentId: "events",
  },
];

function route(id: string): string {
  return `#/entities/${id}`;
}

function baseEntity(
  id: string,
  dataType: string,
  primaryTopicId: string,
  view: SiteEntity["view"],
  viewModels: SiteEntity["viewModels"],
): SiteEntity {
  return {
    id,
    dataType,
    dataVersion: 1,
    title: viewModels.trip?.title ?? viewModels.flight?.title ?? viewModels.event?.title ?? id,
    summary:
      viewModels.trip?.summary ?? viewModels.flight?.summary ?? viewModels.event?.summary ?? "",
    route: route(id),
    primaryTopicId,
    tags: [],
    relationships: [],
    citations: [],
    view,
    viewModels,
  };
}

function tripView(defaultType: "trip"): SiteEntity["view"] {
  return {
    defaultType,
    byContext: {
      navigation: "label",
      collection: "trip",
      relationship: "tile",
      search: "label",
      detail: "trip",
    },
  };
}

function flightView(): SiteEntity["view"] {
  return {
    defaultType: "flight",
    byContext: {
      navigation: "label",
      collection: "flight",
      relationship: "tile",
      search: "label",
      detail: "flight",
    },
  };
}

function eventView(): SiteEntity["view"] {
  return {
    defaultType: "event",
    byContext: {
      navigation: "label",
      collection: "event",
      relationship: "tile",
      search: "label",
      detail: "event",
    },
  };
}

function allDaySpan(startDate: string, endDate: string): EventSchedule {
  return { allDay: true, startDate, endDate };
}

function tripModel(overrides: Partial<TripViewModel> & Pick<TripViewModel, "href">): TripViewModel {
  return {
    title: "Synthetic trip",
    summary: "Synthetic trip summary.",
    kind: "trip",
    status: "confirmed",
    startDate: "2026-01-01",
    endDate: "2026-01-02",
    destination: "Somewhere",
    timeZone: "America/Los_Angeles",
    body: "",
    children: [],
    ...overrides,
  };
}

function tripEntity(
  id: string,
  trip: TripViewModel,
  event: EventViewModel,
  primaryTopicId = "trips",
): SiteEntity {
  return baseEntity(id, "trip", primaryTopicId, tripView("trip"), { trip, event });
}

function flightEntity(id: string, flight: FlightViewModel, event: EventViewModel): SiteEntity {
  return baseEntity(id, "flight", "trips", flightView(), { flight, event });
}

function reservationOrEventEntity(
  id: string,
  dataType: "reservation" | "event",
  event: EventViewModel,
  primaryTopicId: string,
): SiteEntity {
  return baseEntity(id, dataType, primaryTopicId, eventView(), { event });
}

function child(title: string, href: string, role: TripChildRole, order: number) {
  return { title, summary: `${title} summary.`, href, role, order };
}

const tripMulti = tripEntity(
  "trip-multi",
  tripModel({
    href: route("trip-multi"),
    title: "Acadia & NYC",
    summary: "An overall itinerary spanning two segments.",
    startDate: "2026-10-05",
    endDate: "2026-10-13",
    destination: "Acadia & NYC",
    timeZone: "America/New_York",
    children: [
      child("Acadia segment", route("segment-acadia"), "segment", 0),
      child("NYC segment", route("segment-nyc"), "segment", 1),
    ],
  }),
  {
    title: "Acadia & NYC",
    summary: "An overall itinerary spanning two segments.",
    href: route("trip-multi"),
    kind: "event",
    status: "confirmed",
    location: "Acadia & NYC",
    schedule: allDaySpan("2026-10-05", "2026-10-14"),
    body: "",
  },
);

const segmentAcadia = tripEntity(
  "segment-acadia",
  tripModel({
    href: route("segment-acadia"),
    title: "Acadia segment",
    summary: "Bar Harbor and the park.",
    kind: "segment",
    startDate: "2026-10-05",
    endDate: "2026-10-10",
    destination: "Bar Harbor, Maine",
    timeZone: "America/New_York",
    children: [child("Bar Harbor lodging", route("reservation-acadia"), "reservation", 0)],
  }),
  {
    title: "Acadia segment",
    summary: "Bar Harbor and the park.",
    href: route("segment-acadia"),
    kind: "event",
    status: "confirmed",
    schedule: allDaySpan("2026-10-05", "2026-10-11"),
    body: "",
  },
);

const segmentNyc = tripEntity(
  "segment-nyc",
  tripModel({
    href: route("segment-nyc"),
    title: "NYC segment",
    summary: "Hoboken and Manhattan.",
    kind: "segment",
    startDate: "2026-10-10",
    endDate: "2026-10-13",
    destination: "Hoboken, New Jersey",
    timeZone: "America/New_York",
    children: [child("Hoboken lodging", route("reservation-nyc"), "reservation", 0)],
  }),
  {
    title: "NYC segment",
    summary: "Hoboken and Manhattan.",
    href: route("segment-nyc"),
    kind: "event",
    status: "confirmed",
    schedule: allDaySpan("2026-10-10", "2026-10-14"),
    body: "",
  },
);

const reservationAcadia = reservationOrEventEntity(
  "reservation-acadia",
  "reservation",
  {
    title: "Bar Harbor lodging",
    summary: "Still needs to be booked.",
    href: route("reservation-acadia"),
    kind: "appointment",
    status: "tentative",
    schedule: allDaySpan("2026-10-05", "2026-10-06"),
    body: "",
  },
  "trips",
);
reservationAcadia.tags = ["needs-booking"];

const reservationNyc = reservationOrEventEntity(
  "reservation-nyc",
  "reservation",
  {
    title: "Hoboken lodging",
    summary: "Already booked.",
    href: route("reservation-nyc"),
    kind: "appointment",
    status: "confirmed",
    schedule: allDaySpan("2026-10-10", "2026-10-11"),
    body: "",
  },
  "trips",
);

const tripSolo = tripEntity(
  "trip-solo",
  tripModel({
    href: route("trip-solo"),
    title: "Fresno trip",
    summary: "A single, direct trip with no segments.",
    startDate: "2026-09-15",
    endDate: "2026-09-20",
    destination: "Fresno, CA",
    timeZone: "America/Los_Angeles",
    children: [
      child("Outbound flight", route("flight-solo"), "flight", 0),
      child("Rental car", route("reservation-solo"), "reservation", 1),
    ],
  }),
  {
    title: "Fresno trip",
    summary: "A single, direct trip with no segments.",
    href: route("trip-solo"),
    kind: "event",
    status: "confirmed",
    schedule: allDaySpan("2026-09-15", "2026-09-21"),
    body: "",
  },
);

const flightSolo = flightEntity(
  "flight-solo",
  {
    title: "Outbound flight",
    summary: "Alaska 383 to Fresno.",
    href: route("flight-solo"),
    status: "scheduled",
    body: "",
    legs: [
      {
        carrier: "Alaska",
        flightNumber: "383",
        origin: "SEA",
        destination: "FAT",
        departAt: "2026-09-15T12:59:00-07:00",
        departureTimeZone: "America/Los_Angeles",
        arriveAt: "2026-09-15T15:21:00-07:00",
        arrivalTimeZone: "America/Los_Angeles",
      },
    ],
  },
  {
    title: "Outbound flight",
    summary: "Alaska 383 to Fresno.",
    href: route("flight-solo"),
    kind: "event",
    status: "confirmed",
    schedule: {
      allDay: false,
      startAt: "2026-09-15T12:59:00-07:00",
      endAt: "2026-09-15T15:21:00-07:00",
      timeZone: "America/Los_Angeles",
    },
    body: "",
  },
);

const reservationSolo = reservationOrEventEntity(
  "reservation-solo",
  "reservation",
  {
    title: "Rental car",
    summary: "Already booked through Costco Travel.",
    href: route("reservation-solo"),
    kind: "appointment",
    status: "confirmed",
    schedule: {
      allDay: false,
      startAt: "2026-09-15T16:00:00-07:00",
      endAt: "2026-09-20T15:00:00-07:00",
      timeZone: "America/Los_Angeles",
    },
    body: "",
  },
  "trips",
);

const eventSeahawks = reservationOrEventEntity(
  "event-seahawks",
  "event",
  {
    title: "Seahawks vs Patriots",
    summary: "A selected home game.",
    href: route("event-seahawks"),
    kind: "event",
    status: "confirmed",
    schedule: allDaySpan("2026-09-13", "2026-09-14"),
    body: "",
  },
  "seahawks-games",
);

const eventOldConcert = reservationOrEventEntity(
  "event-old-concert",
  "event",
  {
    title: "Old synthetic concert",
    summary: "A concert that ended long ago.",
    href: route("event-old-concert"),
    kind: "event",
    status: "confirmed",
    schedule: allDaySpan("2026-06-01", "2026-06-02"),
    body: "",
  },
  "concerts",
);

const routesManifest: SiteManifest = {
  schemaVersion: 1,
  audience: "local",
  basePath: "/",
  contentDigest: "synthetic-tracker-routes",
  deployable: false,
  taxonomy: TAXONOMY,
  entities: [
    tripMulti,
    segmentAcadia,
    segmentNyc,
    reservationAcadia,
    reservationNyc,
    tripSolo,
    flightSolo,
    reservationSolo,
    eventSeahawks,
    eventOldConcert,
  ],
  searchDocuments: [],
};

async function installRoutesManifest(page: Page): Promise<void> {
  await page.route("**/manifest.json", (route) => route.fulfill({ json: routesManifest }));
  // "Now" is 2026-09-01 in Los Angeles: after the archived concert, before every other fixture.
  await page.clock.install({ time: new Date("2026-09-01T12:00:00-07:00") });
}

test.beforeEach(async ({ page }) => {
  await installRoutesManifest(page);
});

test("lists only root trips on the Trips page, soonest first, with no segment cards", async ({
  page,
}) => {
  await page.goto(".#/trips");
  await expect(page.getByRole("heading", { name: "Trips", level: 1 })).toBeVisible();
  const trips = page.locator(".entity-grid").getByRole("link");
  await expect(trips).toHaveText(["Fresno trip", "Acadia & NYC"]);
  await expect(page.getByRole("link", { name: "Acadia segment", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "NYC segment", exact: true })).toHaveCount(0);
});

test("navigates a single-segment trip directly to its flight and reservation with a stable breadcrumb", async ({
  page,
}) => {
  await page.goto(".#/trips");
  await page.getByRole("main").getByRole("link", { name: "Fresno trip", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Fresno trip", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Trips" }),
  ).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "Outbound flight", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Outbound flight", level: 1 })).toBeVisible();
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: "Trips" })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: "Fresno trip", exact: true })).toBeVisible();
});

test("navigates a multi-segment trip through its segments to their own bookings", async ({
  page,
}) => {
  await page.goto(".#/trips");
  await page.getByRole("main").getByRole("link", { name: "Acadia & NYC", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Acadia & NYC", level: 1 })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "Acadia segment", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Acadia segment", level: 1 })).toBeVisible();
  const segmentBreadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(segmentBreadcrumb.getByRole("link", { name: "Trips" })).toBeVisible();
  await expect(
    segmentBreadcrumb.getByRole("link", { name: "Acadia & NYC", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("main")
    .getByRole("link", { name: "Bar Harbor lodging", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Bar Harbor lodging", level: 1 })).toBeVisible();
  const bookingBreadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(
    bookingBreadcrumb.getByRole("link", { name: "Acadia & NYC", exact: true }),
  ).toBeVisible();
  await expect(
    bookingBreadcrumb.getByRole("link", { name: "Acadia segment", exact: true }),
  ).toBeVisible();
});

test("groups events by category and shows a clear empty state for categories without content", async ({
  page,
}) => {
  await page.goto(".#/events");
  const seahawks = page.getByRole("region", { name: "Seahawks Games" });
  await expect(
    seahawks.getByRole("link", { name: "Seahawks vs Patriots", exact: true }),
  ).toBeVisible();
  // The synthetic concert ended long before the fixed "now", so it is archived and absent here.
  await expect(page.getByText("No concerts scheduled yet.")).toBeVisible();
  await expect(page.getByText("No productions scheduled yet.")).toBeVisible();
  await expect(page.getByText("No festivals & events scheduled yet.")).toBeVisible();
});

test("shows an event's breadcrumb through Events and its category", async ({ page }) => {
  await page.goto(".#/entities/event-seahawks");
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Events", exact: true })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: "Seahawks Games", exact: true })).toBeVisible();
  await breadcrumb.getByRole("link", { name: "Seahawks Games", exact: true }).click();
  await expect(page).toHaveURL(/#\/topics\/seahawks-games$/);
  await expect(page.getByRole("heading", { name: "Seahawks Games", level: 1 })).toBeVisible();
});

test("flags only an explicitly tagged reservation as needing booking on the dashboard", async ({
  page,
}) => {
  await page.goto(".");
  const needsBooking = page.getByRole("region", { name: "Needs booking" });
  await expect(
    needsBooking.getByRole("link", { name: "Bar Harbor lodging", exact: true }),
  ).toBeVisible();
  await expect(
    needsBooking.getByRole("link", { name: "Hoboken lodging", exact: true }),
  ).toHaveCount(0);
  await expect(needsBooking.getByRole("link", { name: "Rental car", exact: true })).toHaveCount(0);
});

test("does not duplicate a segment's span alongside its root trip's span on the calendar", async ({
  page,
}) => {
  await page.goto(".#/calendar/day/2026-10-07?timeZone=America%2FNew_York");
  const allDay = page.getByRole("region", { name: "All-day events" });
  await expect(allDay.getByRole("link", { name: "Acadia & NYC", exact: true })).toHaveCount(1);
  await expect(allDay.getByRole("link", { name: "Acadia segment", exact: true })).toHaveCount(0);
});
