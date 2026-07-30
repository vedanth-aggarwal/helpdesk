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

test.describe("Ticket replies", () => {
  test("an admin can post a reply through the real form, and it persists across a reload", async ({
    page,
    request,
  }) => {
    const ticketId = await seedTicket(request);
    const replyText = `Thanks for reaching out ${unique("reply")}`;

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(`/tickets/${ticketId}`);

    await expect(page.getByText("No replies yet.")).toBeVisible();

    await page.getByLabel("Reply").fill(replyText);
    await page.getByRole("button", { name: "Post reply" }).click();

    await expect(page.getByText(replyText)).toBeVisible();
    await expect(page.getByLabel("Reply")).toHaveValue("");

    // Reload to prove this came from a real GET, not just client-side mutation state.
    await page.reload();
    await expect(page.getByText(replyText)).toBeVisible();
    await expect(page.getByText("Agent")).toBeVisible();

    const repliesResponse = await page.request.get(
      `${SERVER_URL}/api/tickets/${ticketId}/replies`
    );
    expect(repliesResponse.status()).toBe(200);
    const replies = await repliesResponse.json();
    expect(replies).toHaveLength(1);
    expect(replies[0]).toMatchObject({
      body: replyText,
      senderType: "AGENT",
      author: { name: "Admin" },
    });
  });

  test("an AGENT (not just an admin/assignee) can post a reply that persists", async ({
    page,
    request,
  }) => {
    ensureAgentUserSeeded();
    const ticketId = await seedTicket(request);
    const replyText = `Agent reply ${unique("reply")}`;

    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
    await page.goto(`/tickets/${ticketId}`);

    await page.getByLabel("Reply").fill(replyText);
    await page.getByRole("button", { name: "Post reply" }).click();

    await expect(page.getByText(replyText)).toBeVisible();

    const repliesResponse = await page.request.get(
      `${SERVER_URL}/api/tickets/${ticketId}/replies`
    );
    const replies = await repliesResponse.json();
    expect(replies).toHaveLength(1);
    expect(replies[0].senderType).toBe("AGENT");
  });

  test("multiple replies render oldest-first and all persist across a reload", async ({
    page,
    request,
  }) => {
    const ticketId = await seedTicket(request);
    const firstReply = `First reply ${unique("order")}`;
    const secondReply = `Second reply ${unique("order")}`;

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(`/tickets/${ticketId}`);

    await page.getByLabel("Reply").fill(firstReply);
    await page.getByRole("button", { name: "Post reply" }).click();
    await expect(page.getByText(firstReply)).toBeVisible();

    await page.getByLabel("Reply").fill(secondReply);
    await page.getByRole("button", { name: "Post reply" }).click();
    await expect(page.getByText(secondReply)).toBeVisible();

    await page.reload();

    const firstEl = page.getByText(firstReply);
    const secondEl = page.getByText(secondReply);
    await expect(firstEl).toBeVisible();
    await expect(secondEl).toBeVisible();

    const firstY = await firstEl.evaluate((el) => el.getBoundingClientRect().top);
    const secondY = await secondEl.evaluate((el) => el.getBoundingClientRect().top);
    expect(firstY).toBeLessThan(secondY);
  });

  // Empty-body validation, server-error text rendering, pending/disabled
  // submit state, and the badge/label rendering itself are covered with a
  // mocked API by client/src/components/ReplyForm.test.tsx and
  // client/src/pages/TicketDetail.test.tsx — nothing here re-asserts those.

  test("GET /api/tickets/:id/replies 404s for a nonexistent ticket", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    const response = await page.request.get(`${SERVER_URL}/api/tickets/999999/replies`);
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: "Ticket not found" });
  });

  test("POST /api/tickets/:id/replies 404s for a nonexistent ticket", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    const response = await page.request.post(`${SERVER_URL}/api/tickets/999999/replies`, {
      data: { body: "Hello" },
    });
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: "Ticket not found" });
  });
});
