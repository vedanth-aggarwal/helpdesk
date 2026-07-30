import { z } from "zod";

export const ticketSortFields = [
  "subject",
  "requesterName",
  "status",
  "category",
  "createdAt",
] as const;

export const ticketSortFieldSchema = z.enum(ticketSortFields);

export const ticketStatusFilterSchema = z.enum(["OPEN", "RESOLVED", "CLOSED"]);

// "UNCATEGORIZED" is a sentinel for tickets with a null category, not a real TicketCategory
// enum value — the server maps it to a `category: null` filter.
export const ticketCategoryFilterSchema = z.enum([
  "GENERAL_QUESTION",
  "TECHNICAL_QUESTION",
  "REFUND_REQUEST",
  "UNCATEGORIZED",
]);

export const TICKET_PAGE_SIZE = 20;

export const ticketQuerySchema = z.object({
  sortBy: ticketSortFieldSchema.default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: ticketStatusFilterSchema.optional(),
  category: ticketCategoryFilterSchema.optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number("Page must be a number").int("Page must be a whole number").min(1, "Page must be at least 1").default(1),
});

export const ticketIdParamSchema = z.object({
  id: z.coerce
    .number("Ticket id must be a number")
    .int("Ticket id must be a whole number")
    .positive("Ticket id must be positive"),
});

export const ticketAssignSchema = z.object({
  assigneeId: z.uuid("Invalid assignee").nullable(),
});

// Real TicketCategory enum values only — unlike ticketCategoryFilterSchema, no
// "UNCATEGORIZED" sentinel, since a ticket's actual category column has no such value.
export const ticketCategorySchema = z.enum([
  "GENERAL_QUESTION",
  "TECHNICAL_QUESTION",
  "REFUND_REQUEST",
]);

export const ticketUpdateSchema = z.object({
  status: ticketStatusFilterSchema.optional(),
  category: ticketCategorySchema.nullable().optional(),
});

export type TicketSortField = z.infer<typeof ticketSortFieldSchema>;
export type TicketStatusFilter = z.infer<typeof ticketStatusFilterSchema>;
export type TicketCategoryFilter = z.infer<typeof ticketCategoryFilterSchema>;
export type TicketQuery = z.infer<typeof ticketQuerySchema>;
export type TicketIdParam = z.infer<typeof ticketIdParamSchema>;
export type TicketAssignInput = z.infer<typeof ticketAssignSchema>;
export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
