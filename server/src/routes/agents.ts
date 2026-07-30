import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/requireAuth";

export const agentsRouter = Router();

agentsRouter.get("/", requireAuth, async (_req, res) => {
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", deletedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  res.json(agents);
});
