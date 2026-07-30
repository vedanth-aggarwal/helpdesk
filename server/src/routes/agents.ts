import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { agentSelect } from "../lib/prismaSelects";

export const agentsRouter = Router();

agentsRouter.get("/", requireAuth, async (_req, res) => {
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", deletedAt: null },
    select: agentSelect,
    orderBy: { name: "asc" },
  });

  res.json(agents);
});
