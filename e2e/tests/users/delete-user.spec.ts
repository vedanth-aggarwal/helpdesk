import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, loginAs } from "../utils/auth";

const SERVER_URL = "http://localhost:4000";

/** Generates a unique email per test run so specs don't collide with each other. */
function uniqueEmail(label: string) {
  return `${label}.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`;
}

/** Creates a throwaway AGENT user via the API (as the currently-authenticated admin `page`). */
async function createAgent(page: import("@playwright/test").Page, label: string) {
  const email = uniqueEmail(label);
  const name = `Throwaway ${label}`;
  const password = "throwawayPassword123";

  const response = await page.request.post(`${SERVER_URL}/api/users`, {
    data: { name, email, password },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();

  return { id: body.id as string, name, email, password };
}

test.describe("Delete user (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/users");
  });

  test("admin can delete a non-admin user, who then disappears from the list", async ({
    page,
  }) => {
    const agent = await createAgent(page, "delete-me");
    await page.reload();

    const row = page.getByRole("row", { name: new RegExp(agent.email) });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: `Delete ${agent.name}` }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(`Delete ${agent.name}?`)).toBeVisible();

    await dialog.getByRole("button", { name: "Delete" }).click();

    await expect(dialog).not.toBeVisible();
    await expect(row).not.toBeVisible();
    await expect(page.getByText(agent.email)).not.toBeVisible();
  });

  test("clicking Cancel in the confirmation modal leaves the user in the list", async ({
    page,
  }) => {
    const agent = await createAgent(page, "keep-me");
    await page.reload();

    const row = page.getByRole("row", { name: new RegExp(agent.email) });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: `Delete ${agent.name}` }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();

    await expect(dialog).not.toBeVisible();
    await expect(row).toBeVisible();
    await expect(row).toContainText(agent.email);
  });

  test("the delete button for the admin's own row is disabled", async ({ page }) => {
    const row = page.getByRole("row", { name: new RegExp(ADMIN_EMAIL) });
    await expect(row).toBeVisible();

    const deleteButton = row.getByRole("button", { name: "Delete Admin" });
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toHaveAttribute("title", "Admin users cannot be deleted");
  });

  test("DELETE /api/users/:id against an admin user is rejected with 403", async ({
    page,
  }) => {
    const usersResponse = await page.request.get(`${SERVER_URL}/api/users`);
    expect(usersResponse.status()).toBe(200);
    const users = await usersResponse.json();
    const admin = users.find((u: { email: string }) => u.email === ADMIN_EMAIL);
    expect(admin).toBeTruthy();

    const deleteResponse = await page.request.delete(`${SERVER_URL}/api/users/${admin.id}`);
    expect(deleteResponse.status()).toBe(403);
    expect(await deleteResponse.json()).toEqual({ error: "Admin users cannot be deleted" });
  });

  test("a deleted user is locked out of protected routes immediately, and even a fresh login can't reach them afterward", async ({
    page,
    browser,
  }) => {
    const agent = await createAgent(page, "lockout");

    // Log the agent in from a separate browser context, so we get an
    // independent, still-valid session cookie for them.
    const agentContext = await browser.newContext();
    const agentPage = await agentContext.newPage();
    await loginAs(agentPage, agent.email, agent.password);

    // Sanity check: while active, the agent is a normal (non-deleted, non-admin)
    // user — hitting an admin-only route is forbidden by role (403), not by
    // deletion (401).
    const beforeDelete = await agentPage.request.get(`${SERVER_URL}/api/users`);
    expect(beforeDelete.status()).toBe(403);

    // Admin deletes the agent via the UI.
    await page.reload();
    const row = page.getByRole("row", { name: new RegExp(agent.email) });
    await row.getByRole("button", { name: `Delete ${agent.name}` }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(row).not.toBeVisible();

    // The agent's existing (already-authenticated) session is immediately
    // locked out of any protected API route — 401, not 403 — even though
    // nothing about the request itself changed.
    const afterDelete = await agentPage.request.get(`${SERVER_URL}/api/users`);
    expect(afterDelete.status()).toBe(401);
    await agentContext.close();

    // A brand new login attempt with the same, still-correct credentials
    // succeeds at the auth layer (Better Auth itself doesn't know about
    // deletedAt) — but the very next call to a protected route still 401s.
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    await loginAs(freshPage, agent.email, agent.password);

    const afterFreshLogin = await freshPage.request.get(`${SERVER_URL}/api/users`);
    expect(afterFreshLogin.status()).toBe(401);
    await freshContext.close();
  });
});
