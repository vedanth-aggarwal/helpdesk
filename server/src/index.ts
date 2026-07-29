import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "./db";
import { auth } from "./auth";
import { requireAuth } from "./middleware/requireAuth";

const app = express();

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "connected" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.session);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
