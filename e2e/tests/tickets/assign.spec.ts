import { test, expect } from "@playwright/test";
import { INBOUND_EMAIL_WEBHOOK_SECRET, SUPPORT_EMAIL } from "../utils/db";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AGENT_EMAIL,
  AGENT_PASSWORD,
  ensureAgentUserSeeded,
  loginAs,
} from "../utils/auth";

const SERVER_URL = "http://localhost:4000";

/** Generates a unique value per test so specs don't collide via the DB. */
function unique(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Seeds a ticket via the inbound-email webhook (the only way tickets are created). */
async function seedTicket(request: import("@playwright/test").APIRequestContext) {
  const tag = unique("ticket");
  const response = await request.post(`${SERVER_URL}/api/inbound-email`, {
    headers: { Authorization: `Bearer ${INBOUND_EMAIL_WEBHOOK_SECRET}` },
    data: {
      fromName: "Jane Requester",
      fromEmail: "jane.requester@example.com",
      to: SUPPORT_EMAIL,
      subject: `Help needed ${tag}`,
      body: "Something is broken, please help.",
      messageId: `msg-${tag}`,
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return body.id as number;
}

/** Creates a throwaway AGENT user via the API (as the currently-authenticated admin `page`). */
async function createAgent(page: import("@playwright/test").Page, label: string) {
  const tag = unique(label);
  const response = await page.request.post(`${SERVER_URL}/api/users`, {
    data: {
      name: `Throwaway ${tag}`,
      email: `${tag}@example.com`,
      password: "throwawayPassword123",
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return { id: body.id as string, name: body.name as string, email: body.email as string };
}

test.describe("Ticket assignment (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("an admin can assign a ticket to an active agent via the UI, and it persists across a reload", async ({
    page,
    request,
  }) => {
    const ticketId = await seedTicket(request);
    const agent = await createAgent(page, "assignee");

    await page.goto(`/tickets/${ticketId}`);
    const select = page.getByLabel("Assigned to");
    await expect(select).toHaveText("Unassigned");

    await select.click();
    await page.getByRole("option", { name: agent.name }).click();
    await expect(select).toHaveText(agent.name);

    await page.reload();
    await expect(page.getByLabel("Assigned to")).toHaveText(agent.name);

    const getResponse = await page.request.get(`${SERVER_URL}/api/tickets/${ticketId}`);
    expect((await getResponse.json()).assignee).toEqual({
      id: agent.id,
      name: agent.name,
      email: agent.email,
    });
  });

  test("an admin can unassign a ticket via the UI, and it persists across a reload", async ({
    page,
    request,
  }) => {
    const ticketId = await seedTicket(request);
    const agent = await createAgent(page, "unassign");

    const assignResponse = await page.request.patch(
      `${SERVER_URL}/api/tickets/${ticketId}/assign`,
      { data: { assigneeId: agent.id } }
    );
    expect(assignResponse.status()).toBe(200);

    await page.goto(`/tickets/${ticketId}`);
    const select = page.getByLabel("Assigned to");
    await expect(select).toHaveText(agent.name);

    await select.click();
    await page.getByRole("option", { name: "Unassigned" }).click();
    await expect(select).toHaveText("Unassigned");

    await page.reload();
    await expect(page.getByLabel("Assigned to")).toHaveText("Unassigned");

    const getResponse = await page.request.get(`${SERVER_URL}/api/tickets/${ticketId}`);
    expect((await getResponse.json()).assignee).toBeNull();
  });

  // The dropdown itself (rendered only for admins, populated from /api/agents,
  // showing read-only text for agents, rendering an inline error on a failed
  // mutation) is covered by client/src/pages/TicketDetail.test.tsx with a
  // mocked API — the two UI tests above exist only to prove the real
  // assignment actually persists server-side across a reload, not to
  // re-verify the dropdown wiring.

  test("PATCH /api/tickets/:id/assign rejects a non-agent user (an admin) with 400", async ({
    page,
    request,
  }) => {
    const ticketId = await seedTicket(request);

    const usersResponse = await page.request.get(`${SERVER_URL}/api/users`);
    expect(usersResponse.status()).toBe(200);
    const users = await usersResponse.json();
    const admin = users.find((u: { email: string }) => u.email === ADMIN_EMAIL);
    expect(admin).toBeTruthy();

    const response = await page.request.patch(`${SERVER_URL}/api/tickets/${ticketId}/assign`, {
      data: { assigneeId: admin.id },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "Assignee must be an active agent" });
  });

  test("PATCH /api/tickets/:id/assign rejects a soft-deleted agent with 400", async ({
    page,
    request,
  }) => {
    const ticketId = await seedTicket(request);
    const agent = await createAgent(page, "deleted-assignee");

    const deleteResponse = await page.request.delete(`${SERVER_URL}/api/users/${agent.id}`);
    expect(deleteResponse.status()).toBe(204);

    const response = await page.request.patch(`${SERVER_URL}/api/tickets/${ticketId}/assign`, {
      data: { assigneeId: agent.id },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "Assignee must be an active agent" });
  });

  test("PATCH /api/tickets/:id/assign is forbidden for a non-admin (AGENT) session", async ({
    browser,
    request,
  }) => {
    ensureAgentUserSeeded();
    const ticketId = await seedTicket(request);

    const agentContext = await browser.newContext();
    const agentPage = await agentContext.newPage();
    await loginAs(agentPage, AGENT_EMAIL, AGENT_PASSWORD);

    const response = await agentPage.request.patch(
      `${SERVER_URL}/api/tickets/${ticketId}/assign`,
      { data: { assigneeId: null } }
    );
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });

    await agentContext.close();
  });
});
