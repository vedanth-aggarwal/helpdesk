import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, loginAs } from "../utils/auth";

test.describe("Session persistence", () => {
  test("stays signed in after a full page reload", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.reload();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign out" })
    ).toBeVisible();
  });
});

test.describe("Sign out", () => {
  test("clears the session and blocks access to protected routes again", async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");

    // Session cookie should be gone — a fresh visit to a protected route
    // must bounce back to /login rather than rendering the app.
    await page.goto("/");
    await expect(page).toHaveURL("/login");

    // ...and an admin-only route too.
    await page.goto("/users");
    await expect(page).toHaveURL("/login");
  });
});
