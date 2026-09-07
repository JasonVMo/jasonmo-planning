import { expect, test, type Page } from "@playwright/test";
import type { SiteManifest } from "@planning/entity-model";
import { parseSiteManifest } from "../src/manifest.ts";

async function manifestFrom(page: Page): Promise<SiteManifest> {
  const response = await page.request.get("manifest.json");
  expect(response.ok()).toBe(true);
  const value: unknown = await response.json();
  return parseSiteManifest(value);
}

function requiredFirst<Item>(items: readonly Item[], description: string): Item {
  const item = items[0];
  if (item === undefined) throw new Error(`Test manifest requires ${description}`);
  return item;
}

test("loads through localhost at the configured base path and navigates topics", async ({
  page,
}) => {
  const manifest = await manifestFrom(page);
  const topic = requiredFirst(manifest.taxonomy, "at least one topic");

  await page.goto(".");
  await expect(page).toHaveURL(
    new RegExp(`^http://localhost:4173${manifest.basePath.replaceAll("/", "\\/")}`),
  );
  await expect(
    page.getByRole("heading", { name: "Follow the evidence, keep the context" }),
  ).toBeVisible();

  await page.getByRole("link", { name: topic.title }).first().click();
  await expect(page).toHaveURL(new RegExp(`#\\/topics\\/${topic.id}$`));
  await expect(page.getByRole("heading", { name: topic.title, level: 1 })).toBeVisible();
});

test("keeps search query state in the hash URL", async ({ page }) => {
  const manifest = await manifestFrom(page);
  const document = requiredFirst(manifest.searchDocuments, "at least one search document");
  const query = document.title.split(/\s+/).find((word) => word.length >= 4) ?? document.title;

  await page.goto(".");
  await page.getByRole("textbox", { name: "Search research" }).fill(query);
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`#\\/search\\?q=${encodeURIComponent(query)}$`, "i"));
  await expect(page.getByText(new RegExp(`result.*${query}`, "i"))).toBeVisible();
  await expect(page.locator(`[href="${document.route}"]`).first()).toBeVisible();
});

test("skips to main content without replacing the hash route", async ({ page }) => {
  const manifest = await manifestFrom(page);
  const entity = requiredFirst(manifest.entities, "at least one entity");
  await page.goto(`.${entity.route}`);
  const url = page.url();
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await skip.focus();
  await skip.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("heading", { name: entity.title, level: 1 })).toBeVisible();
});

test("restores mobile navigation focus after close", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(".");
  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close navigation" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(opener).toBeFocused();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("supports dark theme and forced-colors rendering", async ({ page }) => {
  await page.goto(".");
  const themeButton = page.getByRole("button", { name: "Use dark theme" });
  await themeButton.click();
  await expect(page.getByRole("button", { name: "Use light theme" })).toBeVisible();

  await page.emulateMedia({ forcedColors: "active" });
  await expect(
    page.getByRole("heading", { name: "Follow the evidence, keep the context" }),
  ).toBeVisible();
});

test("reloads a deep entity hash route", async ({ page }) => {
  const manifest = await manifestFrom(page);
  const entity = requiredFirst(manifest.entities, "at least one entity");

  await page.goto(`.${entity.route}`);
  await expect(page.getByRole("heading", { name: entity.title, level: 1 })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`#\\/entities\\/${entity.id}$`));
  await expect(page.getByRole("heading", { name: entity.title, level: 1 })).toBeVisible();
});

test("uses an occurrence-specific relationship view override", async ({ page }) => {
  const manifest = await manifestFrom(page);
  const source = manifest.entities.find((entity) => entity.relationships.length > 0);
  if (!source) throw new Error("Test manifest requires an entity relationship");
  const relationship = requiredFirst(source.relationships, "a relationship");
  const target = manifest.entities.find((entity) => entity.id === relationship.targetId);
  if (!target) throw new Error(`Relationship target is missing: ${relationship.targetId}`);

  await page.goto(`.${source.route}`);
  const rendered = page
    .locator(".relationships")
    .locator(`[data-view-type="${relationship.viewType}"]`);
  await expect(rendered).toBeVisible();
  await expect(rendered).toContainText(target.title);
});

test("renders a useful not-found page", async ({ page }) => {
  await page.goto(".#/entities/does-not-exist");
  await expect(page.getByRole("heading", { name: "Entity not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Search research" })).toBeVisible();
});

test("shows backlinks only from projected relationships", async ({ page }) => {
  const manifest = await manifestFrom(page);
  const source = manifest.entities.find((entity) => entity.relationships.length > 0);
  if (!source) throw new Error("Test manifest requires an entity relationship");
  const relationship = requiredFirst(source.relationships, "a relationship");
  const target = manifest.entities.find((entity) => entity.id === relationship.targetId);
  if (!target) throw new Error("Test manifest requires a relationship target");
  await page.goto(`.${target.route}`);
  const backlinks = page.getByRole("region", { name: "Referenced by" });
  await expect(backlinks.locator(`[href="${source.route}"]`).first()).toBeVisible();
});

test("blocks executable Markdown and secures external links", async ({ page }) => {
  const unsafeManifest = {
    schemaVersion: 1,
    audience: "local",
    basePath: "/",
    contentDigest: "synthetic-markdown-safety",
    deployable: false,
    taxonomy: [
      {
        id: "synthetic-topic",
        title: "Synthetic topic",
        description: "A test-only topic.",
        order: 1,
      },
    ],
    entities: [
      {
        id: "synthetic-markdown",
        dataType: "markdown",
        dataVersion: 1,
        title: "Markdown safety",
        summary: "Synthetic unsafe Markdown coverage.",
        route: "#/entities/synthetic-markdown",
        primaryTopicId: "synthetic-topic",
        tags: ["synthetic"],
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
        viewModels: {
          label: { title: "Markdown safety", href: "#/entities/synthetic-markdown" },
          tile: {
            title: "Markdown safety",
            summary: "Synthetic unsafe Markdown coverage.",
            href: "#/entities/synthetic-markdown",
          },
          card: {
            title: "Markdown safety",
            summary: "Synthetic unsafe Markdown coverage.",
            href: "#/entities/synthetic-markdown",
            badges: ["synthetic"],
          },
          full: {
            title: "Markdown safety",
            summary: "Synthetic unsafe Markdown coverage.",
            href: "#/entities/synthetic-markdown",
            body: `<script>window.__unsafe = true</script>

[unsafe](javascript:alert(1))

[safe external](https://example.com/source)

![remote image](https://example.com/tracker.png)`,
          },
        },
      },
    ],
    searchDocuments: [
      {
        id: "synthetic-markdown",
        title: "Markdown safety",
        summary: "Synthetic unsafe Markdown coverage.",
        body: "Markdown safety",
        tags: ["synthetic"],
        primaryTopicId: "synthetic-topic",
        route: "#/entities/synthetic-markdown",
      },
    ],
  } satisfies SiteManifest;

  await page.route("**/manifest.json", async (route) => {
    await route.fulfill({ json: unsafeManifest });
  });
  await page.goto(".#/entities/synthetic-markdown");

  await expect(page.locator("script").filter({ hasText: "window.__unsafe" })).toHaveCount(0);
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  await expect(page.locator("img")).toHaveCount(0);
  await expect(page.getByText("[Image omitted: remote image]")).toBeVisible();
  const external = page.getByRole("link", { name: "safe external" });
  await expect(external).toHaveAttribute("target", "_blank");
  await expect(external).toHaveAttribute("rel", /noopener/);
  await expect(external).toHaveAttribute("rel", /noreferrer/);
});

test("shows a retryable manifest error", async ({ page }) => {
  await page.route("**/manifest.json", async (route) => {
    await route.fulfill({ status: 500, body: "synthetic failure" });
  });
  await page.goto(".");
  await expect(page.getByRole("alert")).toContainText("Tracker could not load");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
