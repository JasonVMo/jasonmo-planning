import { defineConfig, devices } from "@playwright/test";

const configuredBasePath = process.env.TRACKER_TEST_BASE_PATH ?? "/jasonmo-planning/";
const basePath =
  configuredBasePath === "/" ? "/" : `/${configuredBasePath.replace(/^\/|\/$/g, "")}/`;

if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) {
  throw new Error(`Invalid TRACKER_TEST_BASE_PATH: ${configuredBasePath}`);
}

const port = 4173;

export default defineConfig({
  testDir: "./apps/site/tests",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}${basePath}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `corepack yarn build:site --base-path ${basePath} && corepack yarn preview --port ${port} --base-path ${basePath}`,
    url: `http://127.0.0.1:${port}${basePath}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
