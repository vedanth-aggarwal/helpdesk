import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../utils/auth";

// Pure client-side behavior (field validation, initial render state, success/error
// UI wiring) is covered by client/src/pages/Login.test.tsx instead — these specs
// stay here because they need a real server to genuinely reject bad credentials.
test.describe("Login page", () => {
  test("shows an error for a correctly-formed but wrong password", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("shows an error for an email with no account", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody-such-user@example.com");
    await page.getByLabel("Password").fill("whatever123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("logs in successfully and redirects to the app", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
    await expect(page.getByText("Admin")).toBeVisible();
  });
});
