import { expect, test } from "@playwright/test";
import { calendarManifest } from "../../storybook/fixtures/calendar.ts";

test.beforeEach(async ({ page }) => {
  await page.route("**/manifest.json", (route) => route.fulfill({ json: calendarManifest }));
});

test("navigates month, day, event details, and reloads date URLs", async ({ page }) => {
  await page.goto(".#/calendar/month/2026-09-07?timeZone=America%2FLos_Angeles");
  await expect(page.getByRole("heading", { name: "September 2026" })).toBeVisible();
  const month = page.getByRole("region", { name: "September 2026" });
  await month
    .getByRole("link", { name: "Monday, September 7, 2026, 5 events", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/calendar\/day\/2026-09-07\?timeZone=America%2FLos_Angeles$/);
  await expect(page.getByRole("heading", { name: "Day at a glance" })).toBeVisible();
  await expect(page.getByText("Overlaps another event")).toHaveCount(0);
  await expect(page.getByText("Continues from previous day")).toBeVisible();
  const suggestions = page.getByRole("complementary", { name: "Suggested activities" });
  await expect(suggestions.getByRole("link", { name: "Roadmap check-in" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Timed events" }).getByRole("link", {
      name: "Roadmap check-in",
    }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Day at a glance" })).toBeVisible();
  await page.getByRole("link", { name: "Design review", exact: true }).click();
  await expect(page).toHaveURL(/#\/entities\/synthetic-design-review$/);
  await expect(page.getByRole("heading", { name: "Design review", level: 1 })).toBeVisible();
  await expect(page.getByText("Studio 2", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "View this day" }).click();
  await expect(page.getByRole("heading", { name: "Day at a glance" })).toBeVisible();
});

test("supports timeline keyboard navigation, history, and exclusive all-day ends", async ({
  page,
}) => {
  await page.goto(".#/calendar/day/2026-09-07?timeZone=America%2FLos_Angeles");
  const timeline = page.getByRole("navigation", { name: "Around this day" });
  await timeline.getByRole("link", { name: "Monday, September 7, 2026, 5 events" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    timeline.getByRole("link", { name: "Tuesday, September 8, 2026, 1 event" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "All-day events" })).toContainText(
    "Planning retreat",
  );
  await page.getByRole("link", { name: "Next day", exact: true }).click();
  await expect(page.getByText("No events on this day.")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("region", { name: "All-day events" })).toContainText(
    "Planning retreat",
  );
});

test("changes months, jumps to a leap date, and preserves the selected time zone", async ({
  page,
}) => {
  await page.goto(".#/calendar/month/2028-01-31?timeZone=UTC");
  await page.getByRole("link", { name: "Next month" }).click();
  await expect(page).toHaveURL(/\/month\/2028-02-29\?timeZone=UTC$/);
  await page.getByLabel("Go to date").fill("2026-09-07");
  await page.getByRole("button", { name: "Go", exact: true }).click();
  await expect(page.getByRole("heading", { name: "September 2026" })).toBeVisible();
  await page.getByLabel("Time zone", { exact: true }).selectOption("America/Los_Angeles");
  await expect(page).toHaveURL(/timeZone=America%2FLos_Angeles$/);
});

test("keeps month/day usable in narrow dark and forced-colors layouts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(".#/calendar/month/2026-09-07?timeZone=UTC");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.getByRole("heading", { name: "September 2026" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .getByRole("navigation", { name: "Calendar views" })
    .getByRole("link", { name: "Day", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Day at a glance" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.getByRole("link", { name: "Design review", exact: true })).toBeVisible();
});

test("rejects malformed date or time-zone routes instead of silently choosing another day", async ({
  page,
}) => {
  for (const route of [
    "month/2026-02-30?timeZone=UTC",
    "day/2026-09-07?timeZone=Invalid",
    "week/2026-09-07?timeZone=UTC",
  ]) {
    await page.goto(`.#/calendar/${route}`);
    await expect(page.getByRole("alert")).toContainText("Invalid calendar address");
  }
});

test("offers a discoverable calendar without inventing canonical events", async ({ page }) => {
  await page.route("**/manifest.json", (route) =>
    route.fulfill({ json: { ...calendarManifest, entities: [] } }),
  );
  await page.goto(".");
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Calendar", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "No calendar events yet" })).toBeVisible();
  await expect(page.locator('[data-view-type="calendar-month"]')).toBeVisible();
});

test("Today uses the current date after midnight and refreshes the undated calendar", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-30T23:59:59Z") });
  await page.goto(".#/calendar?timeZone=UTC");
  await expect(page.getByRole("heading", { name: "September 2026" })).toBeVisible();
  await page.clock.fastForward(31_000);
  await expect(page.getByRole("heading", { name: "October 2026" })).toBeVisible();
  await page.clock.setSystemTime(new Date("2026-10-02T00:00:00Z"));
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page).toHaveURL(/\/month\/2026-10-02\?timeZone=UTC$/);
});

test("preserves time-zone selector focus across query updates", async ({ page }) => {
  await page.goto(".#/calendar/day/2026-09-07?timeZone=UTC");
  const select = page.getByLabel("Time zone", { exact: true });
  await select.focus();
  await select.selectOption("America/Los_Angeles");
  await expect(select).toHaveValue("America/Los_Angeles");
  await expect(select).toBeFocused();
  await select.selectOption("UTC");
  await expect(select).toHaveValue("UTC");
  await expect(select).toBeFocused();
});
