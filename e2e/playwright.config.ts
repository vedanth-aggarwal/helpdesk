import { defineConfig, devices } from "@playwright/test";

const CLIENT_URL = "http://localhost:5173";
const SERVER_URL = "http://localhost:4000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: CLIENT_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Boots the API against the isolated `helpdesk_test` database (server/.env.test)
  // and the Vite dev server, so tests run against real auth/session flows.
  webServer: [
    {
      name: "server",
      command: "npm run dev:test",
      cwd: "../server",
      url: `${SERVER_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      name: "client",
      command: "npm run dev",
      cwd: "../client",
      url: CLIENT_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
