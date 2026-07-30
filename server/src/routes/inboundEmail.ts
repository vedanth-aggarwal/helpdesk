import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireWebhookSecret } from "../middleware/requireWebhookSecret";
import { sendValidationError } from "../lib/validation";

export const inboundEmailRouter = Router();

const inboundEmailSchema = z.object({
  fromName: z.string().trim().min(1, "Sender name is required"),
  fromEmail: z.email("Invalid sender email"),
  to: z.email("Invalid recipient address"),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  messageId: z.string().optional(),
});

inboundEmailRouter.post("/", requireWebhookSecret, async (req, res) => {
  const parsed = inboundEmailSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error, "Invalid request body");
  }

  const { fromName, fromEmail, to, subject, body, messageId } = parsed.data;

  if (to !== process.env.SUPPORT_EMAIL) {
    return res.status(200).json({ status: "ignored" });
  }

  if (messageId) {
    const existing = await prisma.ticket.findUnique({ where: { messageId } });
    if (existing) {
      return res.status(200).json({ status: "duplicate", id: existing.id });
    }
  }

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      body,
      requesterEmail: fromEmail,
      requesterName: fromName,
      messageId,
    },
  });

  res.status(201).json({ id: ticket.id, status: "created" });
});
