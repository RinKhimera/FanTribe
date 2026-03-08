import path from "path"

import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e/tests",
  outputDir: "./e2e/test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["html", { outputFolder: "./e2e/playwright-report" }], ["github"]]
    : [
        [
          "html",
          { outputFolder: "./e2e/playwright-report", open: "on-failure" },
        ],
      ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    // Global setup runs first
    {
      name: "global-setup",
      testMatch: /global\.setup\.ts/,
      testDir: "./e2e",
      teardown: "global-teardown",
    },
    {
      name: "global-teardown",
      testMatch: /global\.teardown\.ts/,
      testDir: "./e2e",
    },
    // Unauthenticated tests (public pages)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["global-setup"],
    },
    // Authenticated user tests
    {
      name: "chromium-auth",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(__dirname, "e2e/.auth/user.json"),
      },
      dependencies: ["global-setup"],
    },
    // Authenticated creator tests
    {
      name: "chromium-creator",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(__dirname, "e2e/.auth/creator.json"),
      },
      dependencies: ["global-setup"],
    },
    // Superuser (admin) tests
    {
      name: "chromium-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(__dirname, "e2e/.auth/admin.json"),
      },
      dependencies: ["global-setup"],
    },
  ],
  webServer: {
    command: process.env.CI
      ? "bun run build && bun run start"
      : "bun dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: process.env.CI ? "production" : "development",
    },
  },
})
