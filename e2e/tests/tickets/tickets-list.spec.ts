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
const WEBHOOK_URL = `${SERVER_URL}/api/inbound-email`;

/** Generates a unique messageId/subject per test so specs don't collide via the DB. */
function unique(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ticketPayload(overrides: Partial<Record<string, unknown>> = {}) {
  const tag = unique("ticket");
  return {
    fromName: "Jane Requester",
    fromEmail: "jane.requester@example.com",
    to: SUPPORT_EMAIL,
    subject: `Help needed ${tag}`,
    body: "Something is broken, please help.",
    messageId: `msg-${tag}`,
    ...overrides,
  };
}

/** Seeds a ticket via the inbound-email webhook (the only way tickets are created). */
async function seedTicket(
  request: import("@playwright/test").APIRequestContext,
  overrides: Partial<Record<string, unknown>> = {}
) {
  const payload = ticketPayload(overrides);
  const response = await request.post(WEBHOOK_URL, {
    headers: { Authorization: `Bearer ${INBOUND_EMAIL_WEBHOOK_SECRET}` },
    data: payload,
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return { payload, id: body.id as number };
}

test.describe("Tickets list", () => {
  test("an authenticated user sees a ticket they know was just created", async ({
    page,
    request,
  }) => {
    const { payload } = await seedTicket(request);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/tickets");

    const row = page.getByRole("row", { name: new RegExp(payload.subject) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(payload.fromName);
    await expect(row).toContainText(payload.fromEmail);
  });

  test("tickets render newest-first (createdAt desc)", async ({ page, request }) => {
    const { payload: first } = await seedTicket(request, {
      subject: `First ticket ${unique("order")}`,
    });
    const { payload: second } = await seedTicket(request, {
      subject: `Second ticket ${unique("order")}`,
    });

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/tickets");

    const firstRow = page.getByRole("row", { name: new RegExp(first.subject) });
    const secondRow = page.getByRole("row", { name: new RegExp(second.subject) });
    await expect(firstRow).toBeVisible();
    await expect(secondRow).toBeVisible();

    const firstIndex = await firstRow.evaluate((el) =>
      Array.from(el.parentElement!.children).indexOf(el)
    );
    const secondIndex = await secondRow.evaluate((el) =>
      Array.from(el.parentElement!.children).indexOf(el)
    );

    expect(secondIndex).toBeLessThan(firstIndex);
  });

  // Enum-label humanizing ("Uncategorized"/"Open", never the raw "OPEN") is
  // pure client-side formatting, covered instead by
  // client/src/components/TicketsTable.test.tsx — that a fresh ticket's
  // category is actually null is already asserted at the DB level in
  // e2e/tests/webhooks/inbound-email.spec.ts, so nothing here would add
  // unique coverage.

  test.describe("Role access", () => {
    test.beforeAll(() => {
      ensureAgentUserSeeded();
    });

    test("an AGENT can access /tickets and see the table", async ({ page, request }) => {
      const { payload } = await seedTicket(request);

      await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
      await page.goto("/tickets");

      await expect(page).toHaveURL("/tickets");
      await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
      await expect(
        page.getByRole("row", { name: new RegExp(payload.subject) })
      ).toBeVisible();
    });

    // Nav-link visibility for both roles is pure UI logic, covered instead
    // by client/src/components/Layout.test.tsx ("always shows the Tickets
    // nav link, regardless of role").
  });
});
