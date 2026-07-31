import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { ticketCategorySchema } from "@helpdesk/core";
import { prisma } from "../db";
import { boss, CLASSIFY_TICKET_QUEUE } from "./boss";

const classificationSchema = z.object({ category: ticketCategorySchema });

interface ClassifyTicketJob {
  ticketId: number;
  subject: string;
  body: string;
}

// Enqueues classification on pg-boss rather than running it inline, so a slow
// or failing model call never blocks the caller (e.g. the inbound-email webhook).
export function classifyTicket(ticketId: number, subject: string, body: string) {
  return boss.send<ClassifyTicketJob>(CLASSIFY_TICKET_QUEUE, { ticketId, subject, body });
}

export async function registerClassifyTicketWorker() {
  await boss.work<ClassifyTicketJob>(CLASSIFY_TICKET_QUEUE, async ([job]) => {
    const { ticketId, subject, body } = job.data;

    const { object } = await generateObject({
      model: openai("gpt-5-nano"),
      schema: classificationSchema,
      prompt: `Classify this support ticket into the category that best matches its subject and body.\n\nSubject: ${subject}\n\nBody: ${body}`,
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { category: object.category },
    });
  });
}
