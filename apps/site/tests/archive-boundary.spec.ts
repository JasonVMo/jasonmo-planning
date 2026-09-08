import { expect, test } from "@playwright/test";
import type {
  EventViewModel,
  SiteEntity,
  SiteManifest,
  TripViewModel,
} from "@planning/entity-model";

function route(id: string): string {
  return `#/entities/${id}`;
}

const trip: TripViewModel = {
  title: "Boundary trip",
  summary: "A trip whose end date sits exactly five weeks before the test clock.",
  href: route("boundary-trip"),
  kind: "trip",
  status: "completed",
  startDate: "2026-09-15",
  endDate: "2026-09-20",
  destination: "Example Coast",
  timeZone: "America/Los_Angeles",
  body: "",
  children: [],
};

const event: EventViewModel = {
  title: trip.title,
  summary: trip.summary,
  href: trip.href,
  kind: "event",
  status: "confirmed",
  schedule: { allDay: true, startDate: trip.startDate, endDate: "2026-09-21" },
  body: "",
};

const boundaryEntity: SiteEntity = {
  id: "boundary-trip",
  dataType: "trip",
  dataVersion: 1,
  title: trip.title,
  summary: trip.summary,
  route: trip.href,
  primaryTopicId: "trips",
  tags: [],
  relationships: [],
  citations: [],
  view: {
    defaultType: "trip",
    byContext: {
      navigation: "label",
      collection: "trip",
      relationship: "tile",
      search: "label",
      detail: "trip",
    },
  },
  viewModels: { trip, event },
};

const boundaryManifest: SiteManifest = {
  schemaVersion: 1,
  audience: "local",
  basePath: "/",
  contentDigest: "synthetic-archive-boundary",
  deployable: false,
  taxonomy: [{ id: "trips", title: "Trips", description: "Upcoming travel.", order: 100 }],
  entities: [boundaryEntity],
  searchDocuments: [],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/manifest.json", (route) => route.fulfill({ json: boundaryManifest }));
});

test("keeps a trip in Trips through day 34 after its end date, evaluated in America/Los_Angeles", async ({
  page,
}) => {
  // Effective end date 2026-09-20; the archive threshold is 2026-10-25. One second before local
  // midnight on the 35th day, the trip must still be active.
  await page.clock.install({ time: new Date("2026-10-24T23:59:00-07:00") });
  await page.goto(".#/trips");
  await expect(page.getByRole("link", { name: "Boundary trip", exact: true })).toBeVisible();

  await page.goto(".#/archive");
  await expect(page.getByText("No archived trips yet.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Boundary trip", exact: true })).toHaveCount(0);
});

test("moves a trip to Archive exactly at midnight on day 35 after its end date, evaluated in America/Los_Angeles", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-25T00:00:01-07:00") });
  await page.goto(".#/trips");
  await expect(page.getByText("No upcoming trips")).toBeVisible();
  await expect(page.getByRole("link", { name: "Boundary trip", exact: true })).toHaveCount(0);

  await page.goto(".#/archive");
  await expect(page.getByRole("link", { name: "Boundary trip", exact: true })).toBeVisible();

  // Its stable entity route keeps working once archived.
  await page.getByRole("link", { name: "Boundary trip", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Boundary trip", level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/#\/entities\/boundary-trip$/);
});

test("evaluates the same UTC instant differently across the America/Los_Angeles day boundary", async ({
  page,
}) => {
  // 2026-10-25T06:00:00Z is 2026-10-24T23:00:00-07:00 in Los Angeles: still day 34, not archived.
  await page.clock.install({ time: new Date("2026-10-25T06:00:00Z") });
  await page.goto(".#/trips");
  await expect(page.getByRole("link", { name: "Boundary trip", exact: true })).toBeVisible();

  // 2026-10-25T07:00:00Z is 2026-10-25T00:00:00-07:00 in Los Angeles: day 35, archived.
  await page.clock.setSystemTime(new Date("2026-10-25T07:00:00Z"));
  await page.reload();
  await expect(page.getByText("No upcoming trips")).toBeVisible();
  await page.goto(".#/archive");
  await expect(page.getByRole("link", { name: "Boundary trip", exact: true })).toBeVisible();
});
