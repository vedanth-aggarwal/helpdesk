"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketUpdateSchema = exports.ticketCategorySchema = exports.ticketAssignSchema = exports.ticketIdParamSchema = exports.ticketQuerySchema = exports.TICKET_PAGE_SIZE = exports.ticketCategoryFilterSchema = exports.ticketStatusFilterSchema = exports.ticketSortFieldSchema = exports.ticketSortFields = void 0;
const zod_1 = require("zod");
exports.ticketSortFields = [
    "subject",
    "requesterName",
    "status",
    "category",
    "createdAt",
];
exports.ticketSortFieldSchema = zod_1.z.enum(exports.ticketSortFields);
exports.ticketStatusFilterSchema = zod_1.z.enum(["OPEN", "RESOLVED", "CLOSED"]);
// "UNCATEGORIZED" is a sentinel for tickets with a null category, not a real TicketCategory
// enum value — the server maps it to a `category: null` filter.
exports.ticketCategoryFilterSchema = zod_1.z.enum([
    "GENERAL_QUESTION",
    "TECHNICAL_QUESTION",
    "REFUND_REQUEST",
    "UNCATEGORIZED",
]);
exports.TICKET_PAGE_SIZE = 20;
exports.ticketQuerySchema = zod_1.z.object({
    sortBy: exports.ticketSortFieldSchema.default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
    status: exports.ticketStatusFilterSchema.optional(),
    category: exports.ticketCategoryFilterSchema.optional(),
    search: zod_1.z.string().trim().min(1).optional(),
    page: zod_1.z.coerce.number("Page must be a number").int("Page must be a whole number").min(1, "Page must be at least 1").default(1),
});
exports.ticketIdParamSchema = zod_1.z.object({
    id: zod_1.z.coerce
        .number("Ticket id must be a number")
        .int("Ticket id must be a whole number")
        .positive("Ticket id must be positive"),
});
exports.ticketAssignSchema = zod_1.z.object({
    assigneeId: zod_1.z.uuid("Invalid assignee").nullable(),
});
// Real TicketCategory enum values only — unlike ticketCategoryFilterSchema, no
// "UNCATEGORIZED" sentinel, since a ticket's actual category column has no such value.
exports.ticketCategorySchema = zod_1.z.enum([
    "GENERAL_QUESTION",
    "TECHNICAL_QUESTION",
    "REFUND_REQUEST",
]);
exports.ticketUpdateSchema = zod_1.z.object({
    status: exports.ticketStatusFilterSchema.optional(),
    category: exports.ticketCategorySchema.nullable().optional(),
});
//# sourceMappingURL=ticket.js.map