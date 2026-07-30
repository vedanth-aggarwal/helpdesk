import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AGENT_EMAIL,
  AGENT_PASSWORD,
  ensureAgentUserSeeded,
  loginAs,
} from "../utils/auth";

const SERVER_URL = "http://localhost:4000";

/** Generates a unique email per test run so specs don't collide with each other. */
function uniqueEmail(label: string) {
  return `${label}.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`;
}

test.describe("Create user (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/users");
  });

  test("admin can create a new agent user who appears in the list and can then log in", async ({
    page,
  }) => {
    const email = uniqueEmail("new-agent");
    const name = "Newly Created Agent";
    const password = "brandNewPassword123";

    await page.getByRole("button", { name: "Add user" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Name").fill(name);
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByLabel("Password").fill(password);
    await dialog.getByRole("button", { name: "Create user" }).click();

    await expect(dialog).not.toBeVisible();

    const row = page.getByRole("row", { name: new RegExp(email) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(name);
    await expect(row).toContainText("AGENT");

    // The newly created user can now sign in with the given credentials.
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");

    await loginAs(page, email, password);
  });

  test("shows a validation error and blocks submission for a too-short name", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add user" }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Name").fill("ab");
    await dialog.getByLabel("Email").fill(uniqueEmail("short-name"));
    await dialog.getByLabel("Password").fill("validPassword123");
    await dialog.getByRole("button", { name: "Create user" }).click();

    await expect(
      dialog.getByText("Name must be at least 3 characters")
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("shows a validation error and blocks submission for an invalid email", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add user" }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Name").fill("Valid Name");
    await dialog.getByLabel("Email").fill("not-an-email");
    await dialog.getByLabel("Password").fill("validPassword123");
    await dialog.getByRole("button", { name: "Create user" }).click();

    await expect(dialog.getByText("Invalid email")).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("shows a validation error and blocks submission for a too-short password", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add user" }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Name").fill("Valid Name");
    await dialog.getByLabel("Email").fill(uniqueEmail("short-password"));
    await dialog.getByLabel("Password").fill("short1");
    await dialog.getByRole("button", { name: "Create user" }).click();

    await expect(
      dialog.getByText("Password must be at least 8 characters")
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("shows a duplicate-email error from the server and keeps the modal open", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add user" }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Name").fill("Duplicate Admin");
    await dialog.getByLabel("Email").fill(ADMIN_EMAIL);
    await dialog.getByLabel("Password").fill("validPassword123");
    await dialog.getByRole("button", { name: "Create user" }).click();

    await expect(dialog.getByText("Email already in use")).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});

test.describe("Create user (non-admin)", () => {
  test.beforeAll(() => {
    ensureAgentUserSeeded();
  });

  test("POST /api/users is blocked for a non-admin agent", async ({
    page,
  }) => {
    // AdminRoute already keeps agents off the /users page (see role-gating
    // spec); this confirms the API is independently guarded too, in case the
    // UI guard is ever bypassed or the route is hit directly.
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);

    const response = await page.request.post(`${SERVER_URL}/api/users`, {
      data: {
        name: "Should Not Be Created",
        email: uniqueEmail("blocked"),
        password: "somePassword123",
      },
    });

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });
});
