"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const requireAuth_1 = require("../middleware/requireAuth");
const requireAdmin_1 = require("../middleware/requireAdmin");
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.get("/", requireAuth_1.requireAuth, requireAdmin_1.requireAdmin, async (_req, res) => {
    const users = await db_1.prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
    res.json(users);
});
//# sourceMappingURL=users.js.map