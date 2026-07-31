import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { prisma } from "../db";
import { boss, AUTO_RESOLVE_TICKET_QUEUE } from "./boss";
import { loadKnowledgeBase } from "./knowledgeBase";
import { getAiAgentId } from "./aiAgent";

const resolutionSchema = z.object({
  canResolve: z.boolean(),
  reply: z.string().nullable(),
  reason: z.string(),
});

interface AutoResolveTicketJob {
  ticketId: number;
  subject: string;
  body: string;
}

// Enqueues auto-resolution on pg-boss, mirroring classifyTicket.ts, so a slow or
// failing model call never blocks the caller (e.g. the inbound-email webhook).
export function autoResolveTicket(ticketId: number, subject: string, body: string) {
  return boss.send<AutoResolveTicketJob>(AUTO_RESOLVE_TICKET_QUEUE, { ticketId, subject, body });
}

export async function registerAutoResolveTicketWorker() {
  await boss.work<AutoResolveTicketJob>(AUTO_RESOLVE_TICKET_QUEUE, async ([job]) => {
    const { ticketId, subject, body } = job.data;

    const aiAgentId = await getAiAgentId();

    // Claim the ticket: only proceed if it's still NEW. If a human (or a retry)
    // already moved it off NEW, back off rather than clobbering their action.
    // Assigning to the AI agent here doubles as the "AI is working on this" signal.
    const claimed = await prisma.ticket.updateMany({
      where: { id: ticketId, status: "NEW" },
      data: { status: "PROCESSING", assigneeId: aiAgentId },
    });

    if (claimed.count === 0) {
      return;
    }

    try {
      const knowledgeBase = loadKnowledgeBase();

      const { object } = await generateObject({
        model: openai("gpt-5-nano"),
        schema: resolutionSchema,
        prompt: `You are an AI support agent. Using ONLY the knowledge base below, decide whether you can confidently resolve this support ticket yourself. Follow the "Escalation Rules" section in the knowledge base exactly — if any rule there applies, or you are not confident, do not resolve it (set canResolve to false and reply to null).\n\nIf you can resolve it, write a helpful, complete customer-facing reply in "reply" that directly answers the ticket using the knowledge base.\n\n--- KNOWLEDGE BASE ---\n${knowledgeBase}\n--- END KNOWLEDGE BASE ---\n\nSubject: ${subject}\n\nBody: ${body}`,
      });

      if (object.canResolve && object.reply) {
        await prisma.$transaction([
          prisma.ticketReply.create({
            data: { body: object.reply, ticketId, senderType: "AI" },
          }),
          prisma.ticket.update({
            where: { id: ticketId },
            data: { status: "RESOLVED", resolvedAt: new Date() },
          }),
        ]);
      } else {
        // Couldn't confidently resolve it (or an escalation rule applied) —
        // hand it back to the human queue, unassigning from AI.
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "OPEN", assigneeId: null },
        });
      }
    } catch (error) {
      console.error(`Failed to auto-resolve ticket ${ticketId}:`, error);
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "OPEN", assigneeId: null },
      });
    }
  });
}
