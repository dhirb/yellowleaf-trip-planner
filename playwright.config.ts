import { defineConfig, devices } from "@playwright/test";

const HARNESS_URL = "http://localhost:5173/harness.html";

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  outputDir: "./test-results",
  use: {
    baseURL: HARNESS_URL,
    viewport: { width: 440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 440, height: 900 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 440, height: 900 },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: HARNESS_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
