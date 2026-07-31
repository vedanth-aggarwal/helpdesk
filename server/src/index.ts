import "./instrument";
import "dotenv/config";
import express from "express";
import cors from "cors";
import * as Sentry from "@sentry/node";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "./db";
import { auth } from "./auth";
import { requireAuth } from "./middleware/requireAuth";
import { usersRouter } from "./routes/users";
import { inboundEmailRouter } from "./routes/inboundEmail";
import { ticketsRouter } from "./routes/tickets";
import { agentsRouter } from "./routes/agents";
import { startBoss } from "./lib/boss";
import { registerClassifyTicketWorker } from "./lib/classifyTicket";
import { registerAutoResolveTicketWorker } from "./lib/autoResolveTicket";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "connected" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.session);
});

app.use("/api/users", usersRouter);
app.use("/api/inbound-email", inboundEmailRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/agents", agentsRouter);

Sentry.setupExpressErrorHandler(app);

const PORT = process.env.PORT || 4000;

startBoss()
  .then(registerClassifyTicketWorker)
  .then(registerAutoResolveTicketWorker)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start pg-boss:", error);
    process.exit(1);
  });
