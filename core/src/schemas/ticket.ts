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

export const ticketQuerySchema = z.object({
  sortBy: ticketSortFieldSchema.default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: ticketStatusFilterSchema.optional(),
  category: ticketCategoryFilterSchema.optional(),
  search: z.string().trim().min(1).optional(),
});

export type TicketSortField = z.infer<typeof ticketSortFieldSchema>;
export type TicketStatusFilter = z.infer<typeof ticketStatusFilterSchema>;
export type TicketCategoryFilter = z.infer<typeof ticketCategoryFilterSchema>;
export type TicketQuery = z.infer<typeof ticketQuerySchema>;
