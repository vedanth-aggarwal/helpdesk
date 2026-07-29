import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Seeded admin credentials — see server/.env.test (SEED_ADMIN_EMAIL/PASSWORD)
// and server/prisma/seed.ts.
export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "password123";

// Non-admin test user — see server/prisma/seed-e2e-agent.ts. Only ADMIN and
// AGENT roles exist and there's no signup/user-management UI yet, so this
// user is created directly via Prisma against the `helpdesk_test` database.
export const AGENT_EMAIL = "agent.e2e@example.com";
export const AGENT_PASSWORD = "agentPassword123";

const SERVER_DIR = path.resolve(__dirname, "../../../server");

/**
 * Ensures the AGENT test user exists in the `helpdesk_test` database.
 * Idempotent (the underlying script upserts-by-checking-existence), safe to
 * call from multiple spec files/workers.
 */
export function ensureAgentUserSeeded() {
  execFileSync(
    "npx",
    [
      "dotenv",
      "-e",
      ".env.test",
      "--",
      "npx",
      "ts-node",
      "--transpile-only",
      "prisma/seed-e2e-agent.ts",
    ],
    { cwd: SERVER_DIR, stdio: "inherit" }
  );
}

/** Logs in through the real login form and waits for the post-login redirect. */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}
