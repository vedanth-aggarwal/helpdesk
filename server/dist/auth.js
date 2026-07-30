"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const db_1 = require("./db");
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(db_1.prisma, { provider: "postgresql" }),
    emailAndPassword: {
        enabled: true,
        disableSignUp: true,
    },
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [process.env.CLIENT_URL || "http://localhost:5173"],
    rateLimit: {
        enabled: process.env.NODE_ENV === "production",
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "AGENT",
            },
        },
    },
});
//# sourceMappingURL=auth.js.map