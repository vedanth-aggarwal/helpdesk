import { z } from "zod";

export const ticketSortFields = [
  "subject",
  "requesterName",
  "status",
  "category",
  "createdAt",
] as const;

export const ticketSortFieldSchema = z.enum(ticketSortFields);

export const ticketQuerySchema = z.object({
  sortBy: ticketSortFieldSchema.default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TicketSortField = z.infer<typeof ticketSortFieldSchema>;
export type TicketQuery = z.infer<typeof ticketQuerySchema>;
