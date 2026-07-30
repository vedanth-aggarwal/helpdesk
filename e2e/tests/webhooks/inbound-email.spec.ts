import { test, expect } from "@playwright/test";
import { INBOUND_EMAIL_WEBHOOK_SECRET, SUPPORT_EMAIL, queryDb } from "../utils/db";

const SERVER_URL = "http://localhost:4000";
const WEBHOOK_URL = `${SERVER_URL}/api/inbound-email`;

/** Generates a unique messageId/subject per test so specs don't collide via the DB. */
function unique(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  const tag = unique("payload");
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

async function findTicketsByMessageId(messageId: string) {
  return queryDb<{
    id: number;
    subject: string;
    body: string;
    requesterEmail: string;
    requesterName: string;
    status: string;
    category: string | null;
    messageId: string | null;
  }>('SELECT * FROM "ticket" WHERE "messageId" = $1', [messageId]);
}

test.describe("POST /api/inbound-email", () => {
  test("valid request with correct secret and matching `to` creates a ticket", async ({
    request,
  }) => {
    const payload = validPayload();

    const response = await request.post(WEBHOOK_URL, {
      headers: { Authorization: `Bearer ${INBOUND_EMAIL_WEBHOOK_SECRET}` },
      data: payload,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(typeof body.id).toBe("number");
    expect(body.status).toBe("created");

    const rows = await findTicketsByMessageId(payload.messageId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: body.id,
      subject: payload.subject,
      body: payload.body,
      requesterEmail: payload.fromEmail,
      requesterName: payload.fromName,
      status: "OPEN",
      category: null,
      messageId: payload.messageId,
    });
  });

  test("missing Authorization header is rejected with 401 and creates no ticket", async ({
    request,
  }) => {
    const payload = validPayload();

    const response = await request.post(WEBHOOK_URL, { data: payload });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });

    const rows = await findTicketsByMessageId(payload.messageId);
    expect(rows).toHaveLength(0);
  });

  test("wrong Authorization header is rejected with 401 and creates no ticket", async ({
    request,
  }) => {
    const payload = validPayload();

    const response = await request.post(WEBHOOK_URL, {
      headers: { Authorization: "Bearer not-the-right-secret" },
      data: payload,
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });

    const rows = await findTicketsByMessageId(payload.messageId);
    expect(rows).toHaveLength(0);
  });

  test("invalid body (empty subject) is rejected with 400 and creates no ticket", async ({
    request,
  }) => {
    const payload = validPayload({ subject: "" });

    const response = await request.post(WEBHOOK_URL, {
      headers: { Authorization: `Bearer ${INBOUND_EMAIL_WEBHOOK_SECRET}` },
      data: payload,
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "Subject is required" });

    const rows = await findTicketsByMessageId(payload.messageId);
    expect(rows).toHaveLength(0);
  });

  test("invalid body (malformed fromEmail) is rejected with 400 and creates no ticket", async ({
    request,
  }) => {
    const payload = validPayload({ fromEmail: "not-an-email" });

    const response = await request.post(WEBHOOK_URL, {
      headers: { Authorization: `Bearer ${INBOUND_EMAIL_WEBHOOK_SECRET}` },
      data: payload,
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid sender email" });

    const rows = await findTicketsByMessageId(payload.messageId);
    expect(rows).toHaveLength(0);
  });

  test("`to` not matching SUPPORT_EMAIL is ignored (200) and creates no ticket", async ({
    request,
  }) => {
    const payload = validPayload({ to: "someone-else@example.com" });

    const response = await request.post(WEBHOOK_URL, {
      headers: { Authorization: `Bearer ${INBOUND_EMAIL_WEBHOOK_SECRET}` },
      data: payload,
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: "ignored" });

    const rows = await findTicketsByMessageId(payload.messageId);
    expect(rows).toHaveLength(0);
  });

  test("resending the same messageId is treated as a duplicate and does not create a second row", async ({
    request,
  }) => {
    const payload = validPayload();

    const first = await request.post(WEBHOOK_URL, {
      headers: { Authorization: `Bearer ${INBOUND_EMAIL_WEBHOOK_SECRET}` },
      data: payload,
    });
    expect(first.status()).toBe(201);
    const firstBody = await first.json();
    expect(firstBody.status).toBe("created");

    const second = await request.post(WEBHOOK_URL, {
      headers: { Authorization: `Bearer ${INBOUND_EMAIL_WEBHOOK_SECRET}` },
      data: payload,
    });
    expect(second.status()).toBe(200);
    const secondBody = await second.json();
    expect(secondBody).toEqual({ status: "duplicate", id: firstBody.id });

    const rows = await findTicketsByMessageId(payload.messageId);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(firstBody.id);
  });
});
