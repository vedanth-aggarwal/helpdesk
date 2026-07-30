import { Router } from "express";
import {
  ticketQuerySchema,
  ticketIdParamSchema,
  ticketAssignSchema,
  ticketUpdateSchema,
  TICKET_PAGE_SIZE,
} from "@helpdesk/core";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";

export const ticketsRouter = Router();

ticketsRouter.get("/", requireAuth, async (req, res) => {
  const parsed = ticketQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Invalid query parameters" });
  }

  const { sortBy, sortOrder, status, category, search, page } = parsed.data;

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

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      select: {
        id: true,
        subject: true,
        requesterEmail: true,
        requesterName: true,
        status: true,
        category: true,
        createdAt: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * TICKET_PAGE_SIZE,
      take: TICKET_PAGE_SIZE,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ tickets, total });
});

ticketsRouter.get("/:id", requireAuth, async (req, res) => {
  const parsed = ticketIdParamSchema.safeParse(req.params);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Invalid ticket id" });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      subject: true,
      body: true,
      requesterEmail: true,
      requesterName: true,
      status: true,
      category: true,
      messageId: true,
      createdAt: true,
      updatedAt: true,
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  res.json(ticket);
});

ticketsRouter.patch("/:id", requireAuth, async (req, res) => {
  const parsedParams = ticketIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res
      .status(400)
      .json({ error: parsedParams.error.issues[0]?.message ?? "Invalid ticket id" });
  }

  const parsedBody = ticketUpdateSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(400)
      .json({ error: parsedBody.error.issues[0]?.message ?? "Invalid request body" });
  }

  const { id } = parsedParams.data;
  const { status, category } = parsedBody.data;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(category !== undefined && { category }),
    },
    select: {
      id: true,
      status: true,
      category: true,
    },
  });

  res.json(updated);
});

ticketsRouter.patch("/:id/assign", requireAuth, requireAdmin, async (req, res) => {
  const parsedParams = ticketIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res
      .status(400)
      .json({ error: parsedParams.error.issues[0]?.message ?? "Invalid ticket id" });
  }

  const parsedBody = ticketAssignSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(400)
      .json({ error: parsedBody.error.issues[0]?.message ?? "Invalid request body" });
  }

  const { id } = parsedParams.data;
  const { assigneeId } = parsedBody.data;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  if (assigneeId !== null) {
    const agent = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!agent || agent.deletedAt || agent.role !== "AGENT") {
      return res.status(400).json({ error: "Assignee must be an active agent" });
    }
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: { assigneeId },
    select: {
      id: true,
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  res.json(updated);
});
