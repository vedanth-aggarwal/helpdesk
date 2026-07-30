"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_1 = require("better-auth/node");
const db_1 = require("./db");
const auth_1 = require("./auth");
const requireAuth_1 = require("./middleware/requireAuth");
const users_1 = require("./routes/users");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));
app.all("/api/auth/*splat", (0, node_1.toNodeHandler)(auth_1.auth));
app.use(express_1.default.json());
app.get("/health", async (_req, res) => {
    await db_1.prisma.$queryRaw `SELECT 1`;
    res.json({ status: "ok", database: "connected" });
});
app.get("/api/me", requireAuth_1.requireAuth, (req, res) => {
    res.json(req.session);
});
app.use("/api/users", users_1.usersRouter);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map