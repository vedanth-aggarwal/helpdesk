import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, loginAs } from "../utils/auth";

test.describe("Route guards (unauthenticated)", () => {
  test("visiting the home page redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("visiting an admin-only page redirects to /login", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page).toHaveURL("/login");
  });

  test("visiting an unknown path redirects to /login (via the / catch-all)", async ({
    page,
  }) => {
    await page.goto("/some-page-that-does-not-exist");
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Route guards (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("visiting /login while already signed in redirects to the app", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });

  test("visiting an unknown path redirects to the home page", async ({
    page,
  }) => {
    await page.goto("/some-page-that-does-not-exist");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  });
});
