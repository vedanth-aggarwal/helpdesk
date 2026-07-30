import { z } from "zod";
export declare const ticketSortFields: readonly ["subject", "requesterName", "status", "category", "createdAt"];
export declare const ticketSortFieldSchema: z.ZodEnum<{
    subject: "subject";
    requesterName: "requesterName";
    status: "status";
    category: "category";
    createdAt: "createdAt";
}>;
export declare const ticketQuerySchema: z.ZodObject<{
    sortBy: z.ZodDefault<z.ZodEnum<{
        subject: "subject";
        requesterName: "requesterName";
        status: "status";
        category: "category";
        createdAt: "createdAt";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export type TicketSortField = z.infer<typeof ticketSortFieldSchema>;
export type TicketQuery = z.infer<typeof ticketQuerySchema>;
//# sourceMappingURL=ticket.d.ts.map