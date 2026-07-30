import { z } from "zod";
export declare const ticketSortFields: readonly ["subject", "requesterName", "status", "category", "createdAt"];
export declare const ticketSortFieldSchema: z.ZodEnum<{
    subject: "subject";
    requesterName: "requesterName";
    status: "status";
    category: "category";
    createdAt: "createdAt";
}>;
export declare const ticketStatusFilterSchema: z.ZodEnum<{
    OPEN: "OPEN";
    RESOLVED: "RESOLVED";
    CLOSED: "CLOSED";
}>;
export declare const ticketCategoryFilterSchema: z.ZodEnum<{
    GENERAL_QUESTION: "GENERAL_QUESTION";
    TECHNICAL_QUESTION: "TECHNICAL_QUESTION";
    REFUND_REQUEST: "REFUND_REQUEST";
    UNCATEGORIZED: "UNCATEGORIZED";
}>;
export declare const TICKET_PAGE_SIZE = 20;
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
    status: z.ZodOptional<z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
        CLOSED: "CLOSED";
    }>>;
    category: z.ZodOptional<z.ZodEnum<{
        GENERAL_QUESTION: "GENERAL_QUESTION";
        TECHNICAL_QUESTION: "TECHNICAL_QUESTION";
        REFUND_REQUEST: "REFUND_REQUEST";
        UNCATEGORIZED: "UNCATEGORIZED";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const ticketIdParamSchema: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const ticketAssignSchema: z.ZodObject<{
    assigneeId: z.ZodNullable<z.ZodUUID>;
}, z.core.$strip>;
export declare const ticketCategorySchema: z.ZodEnum<{
    GENERAL_QUESTION: "GENERAL_QUESTION";
    TECHNICAL_QUESTION: "TECHNICAL_QUESTION";
    REFUND_REQUEST: "REFUND_REQUEST";
}>;
export declare const ticketUpdateSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
        CLOSED: "CLOSED";
    }>>;
    category: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        GENERAL_QUESTION: "GENERAL_QUESTION";
        TECHNICAL_QUESTION: "TECHNICAL_QUESTION";
        REFUND_REQUEST: "REFUND_REQUEST";
    }>>>;
}, z.core.$strip>;
export type TicketSortField = z.infer<typeof ticketSortFieldSchema>;
export type TicketStatusFilter = z.infer<typeof ticketStatusFilterSchema>;
export type TicketCategoryFilter = z.infer<typeof ticketCategoryFilterSchema>;
export type TicketQuery = z.infer<typeof ticketQuerySchema>;
export type TicketIdParam = z.infer<typeof ticketIdParamSchema>;
export type TicketAssignInput = z.infer<typeof ticketAssignSchema>;
export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
//# sourceMappingURL=ticket.d.ts.map