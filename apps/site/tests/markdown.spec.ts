import { expect, test } from "@playwright/test";

test("renders bundled Markdown-file and source-string embeds without runtime file requests", async ({
  page,
}) => {
  const markdownRequests: string[] = [];
  page.on("request", (request) => {
    if (/\.md(?:[?#]|$)/.test(request.url())) markdownRequests.push(request.url());
  });
  await page.goto(".#/help/markdown");
  await expect(page).toHaveURL(/#\/help\/markdown$/);
  await expect(page.getByRole("heading", { name: "Markdown from a file" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Markdown from a source string" })).toBeVisible();
  await expect(page.getByRole("table")).toContainText("Bold and italic");
  await expect(page.getByRole("checkbox", { name: "Completed task" }).first()).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Incomplete task" })).toBeDisabled();
  await expect(page.locator("del")).toHaveText("Old wording");
  await expect(page.locator("strong").filter({ hasText: "rendered example" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Markdown from a file" })).toBeVisible();
  expect(markdownRequests).toEqual([]);
});

test("keeps embedded Markdown readable in narrow and dark layouts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(".#/help/markdown");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.getByRole("link", { name: "dashboard", exact: true })).toBeVisible();
});
