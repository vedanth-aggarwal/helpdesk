import { Router } from "express";
import { ticketQuerySchema } from "@helpdesk/core";
import type { Prisma } from "../generated/prisma/client";
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

  const { sortBy, sortOrder, status, category, search } = parsed.data;

  const where: Prisma.TicketWhereInput = {
    ...(status && { status }),
    ...(category && { category: category === "UNCATEGORIZED" ? null : category }),
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" } },
        { requesterName: { contains: search, mode: "insensitive" } },
        { requesterEmail: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const tickets = await prisma.ticket.findMany({
    where,
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
