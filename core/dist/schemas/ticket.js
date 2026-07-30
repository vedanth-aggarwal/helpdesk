"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketQuerySchema = exports.ticketCategoryFilterSchema = exports.ticketStatusFilterSchema = exports.ticketSortFieldSchema = exports.ticketSortFields = void 0;
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
exports.ticketQuerySchema = zod_1.z.object({
    sortBy: exports.ticketSortFieldSchema.default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
    status: exports.ticketStatusFilterSchema.optional(),
    category: exports.ticketCategoryFilterSchema.optional(),
    search: zod_1.z.string().trim().min(1).optional(),
});
//# sourceMappingURL=ticket.js.map