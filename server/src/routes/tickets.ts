import { Router } from "express";
import { ticketQuerySchema } from "@helpdesk/core";
import { prisma } from "../db";
import { requireAuth } from "../middleware/requireAuth";

export const ticketsRouter = Router();

ticketsRouter.get("/", requireAuth, async (req, res) => {
  const parsed = ticketQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Invalid query parameters" });
  }

  const { sortBy, sortOrder } = parsed.data;

  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      subject: true,
      requesterEmail: true,
      requesterName: true,
      status: true,
      category: true,
      createdAt: true,
    },
    orderBy: { [sortBy]: sortOrder },
  });

  res.json(tickets);
});
