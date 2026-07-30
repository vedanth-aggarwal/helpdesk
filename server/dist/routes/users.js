"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const crypto_1 = require("crypto");
const express_1 = require("express");
const crypto_2 = require("better-auth/crypto");
const zod_1 = require("zod");
const db_1 = require("../db");
const requireAuth_1 = require("../middleware/requireAuth");
const requireAdmin_1 = require("../middleware/requireAdmin");
exports.usersRouter = (0, express_1.Router)();
const createUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(3, "Name must be at least 3 characters"),
    email: zod_1.z.email("Invalid email"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
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
exports.usersRouter.post("/", requireAuth_1.requireAuth, requireAdmin_1.requireAdmin, async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { name, email, password } = parsed.data;
    const existing = await db_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ error: "Email already in use" });
    }
    const user = await db_1.prisma.user.create({
        data: {
            email,
            name,
            role: "AGENT",
            emailVerified: true,
        },
    });
    const hashed = await (0, crypto_2.hashPassword)(password);
    await db_1.prisma.account.create({
        data: {
            id: (0, crypto_1.randomUUID)(),
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: hashed,
        },
    });
    res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    });
});
//# sourceMappingURL=users.js.map