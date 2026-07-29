import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AGENT_EMAIL,
  AGENT_PASSWORD,
  ensureAgentUserSeeded,
  loginAs,
} from "../utils/auth";

test.describe("Role-gated routes (AdminRoute)", () => {
  test.beforeAll(() => {
    ensureAgentUserSeeded();
  });

  test("an ADMIN can access the admin-only Users page", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto("/users");

    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });

  test("an ADMIN sees the Users nav link", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await expect(
      page.getByRole("link", { name: "Users" })
    ).toBeVisible();
  });

  test("an AGENT is redirected away from the admin-only Users page", async ({
    page,
  }) => {
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);

    await page.goto("/users");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  });

  test("an AGENT does not see the Users nav link", async ({ page }) => {
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);

    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
  });
});
