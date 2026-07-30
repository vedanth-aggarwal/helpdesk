import { randomUUID } from "crypto";
import { Router } from "express";
import { hashPassword } from "better-auth/crypto";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "@helpdesk/core";
import { prisma } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import { sendValidationError } from "../lib/validation";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export const usersRouter = Router();

usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: publicUserSelect,
    orderBy: { createdAt: "asc" },
  });

  res.json(users);
});

usersRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error, "Invalid request body");
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: "AGENT",
      emailVerified: true,
    },
    select: publicUserSelect,
  });

  const hashed = await hashPassword(password);

  await prisma.account.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashed,
    },
  });

  res.status(201).json(user);
});

usersRouter.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsedParams = userIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return sendValidationError(res, parsedParams.error, "Invalid user id");
  }

  const parsedBody = updateUserSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error, "Invalid request body");
  }

  const { id } = parsedParams.data;
  const { name, email, password } = parsedBody.data;

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser || existingUser.deletedAt) {
    return res.status(404).json({ error: "User not found" });
  }

  const emailTaken = await prisma.user.findFirst({ where: { email, NOT: { id } } });
  if (emailTaken) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { name, email },
    select: publicUserSelect,
  });

  if (password) {
    const hashed = await hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hashed },
    });
  }

  res.json(user);
});

usersRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsedParams = userIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return sendValidationError(res, parsedParams.error, "Invalid user id");
  }

  const { id } = parsedParams.data;

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser || existingUser.deletedAt) {
    return res.status(404).json({ error: "User not found" });
  }

  if (existingUser.role === "ADMIN") {
    return res.status(403).json({ error: "Admin users cannot be deleted" });
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.status(204).send();
});
