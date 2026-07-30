import { Router } from "express";
import {
  ticketQuerySchema,
  ticketIdParamSchema,
  ticketAssignSchema,
  ticketUpdateSchema,
  ticketReplyCreateSchema,
  TICKET_PAGE_SIZE,
} from "@helpdesk/core";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import { sendValidationError } from "../lib/validation";
import { agentSelect } from "../lib/prismaSelects";

const authorSelect = { id: true, name: true } as const;

function ticketExists(id: number) {
  return prisma.ticket.findUnique({ where: { id }, select: { id: true } });
}

export const ticketsRouter = Router();

ticketsRouter.get("/", requireAuth, async (req, res) => {
  const parsed = ticketQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error, "Invalid query parameters");
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
        assignee: { select: agentSelect },
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
    return sendValidationError(res, parsed.error, "Invalid ticket id");
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
      assignee: { select: agentSelect },
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
    return sendValidationError(res, parsedParams.error, "Invalid ticket id");
  }

  const parsedBody = ticketUpdateSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error, "Invalid request body");
  }

  const { id } = parsedParams.data;
  const { status, category } = parsedBody.data;

  if (!(await ticketExists(id))) {
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
    return sendValidationError(res, parsedParams.error, "Invalid ticket id");
  }

  const parsedBody = ticketAssignSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error, "Invalid request body");
  }

  const { id } = parsedParams.data;
  const { assigneeId } = parsedBody.data;

  if (!(await ticketExists(id))) {
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
      assignee: { select: agentSelect },
    },
  });

  res.json(updated);
});

ticketsRouter.get("/:id/replies", requireAuth, async (req, res) => {
  const parsedParams = ticketIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return sendValidationError(res, parsedParams.error, "Invalid ticket id");
  }

  const { id } = parsedParams.data;

  if (!(await ticketExists(id))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: id },
    select: {
      id: true,
      body: true,
      senderType: true,
      createdAt: true,
      author: { select: authorSelect },
    },
    orderBy: { createdAt: "asc" },
  });

  res.json(replies);
});

ticketsRouter.post("/:id/replies", requireAuth, async (req, res) => {
  const parsedParams = ticketIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return sendValidationError(res, parsedParams.error, "Invalid ticket id");
  }

  const parsedBody = ticketReplyCreateSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error, "Invalid request body");
  }

  const { id } = parsedParams.data;
  const { body } = parsedBody.data;

  if (!(await ticketExists(id))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const reply = await prisma.ticketReply.create({
    data: {
      body,
      ticketId: id,
      authorId: req.session!.user.id,
      senderType: "AGENT",
    },
    select: {
      id: true,
      body: true,
      senderType: true,
      createdAt: true,
      author: { select: authorSelect },
    },
  });

  res.status(201).json(reply);
});
