import "dotenv/config";
import express from "express";
import { prisma } from "./db";

const app = express();
app.use(express.json());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "connected" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
