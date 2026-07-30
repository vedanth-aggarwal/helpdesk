"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketQuerySchema = exports.ticketSortFieldSchema = exports.ticketSortFields = void 0;
const zod_1 = require("zod");
exports.ticketSortFields = [
    "subject",
    "requesterName",
    "status",
    "category",
    "createdAt",
];
exports.ticketSortFieldSchema = zod_1.z.enum(exports.ticketSortFields);
exports.ticketQuerySchema = zod_1.z.object({
    sortBy: exports.ticketSortFieldSchema.default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
//# sourceMappingURL=ticket.js.map