"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.E2E_AGENT_PASSWORD = exports.E2E_AGENT_EMAIL = void 0;
// One-off seed script for e2e tests: creates a non-admin AGENT user in the
// `helpdesk_test` database so role-gating (AdminRoute) tests have a second
// role to test against. Idempotent — safe to run before every e2e run.
// Invoked directly by e2e/tests specs via `npx dotenv -e .env.test -- npx ts-node --transpile-only prisma/seed-e2e-agent.ts`
// (mirrors the pattern in prisma/seed.ts). Not part of `npm run seed`/`seed:test`.
require("dotenv/config");
const crypto_1 = require("crypto");
const crypto_2 = require("better-auth/crypto");
const db_1 = require("../src/db");
exports.E2E_AGENT_EMAIL = "agent.e2e@example.com";
exports.E2E_AGENT_PASSWORD = "agentPassword123";
async function main() {
    const existing = await db_1.prisma.user.findUnique({
        where: { email: exports.E2E_AGENT_EMAIL },
    });
    if (existing) {
        console.log(`User ${exports.E2E_AGENT_EMAIL} already exists, skipping.`);
        return;
    }
    const user = await db_1.prisma.user.create({
        data: {
            email: exports.E2E_AGENT_EMAIL,
            name: "E2E Agent",
            role: "AGENT",
            emailVerified: true,
        },
    });
    const hashed = await (0, crypto_2.hashPassword)(exports.E2E_AGENT_PASSWORD);
    await db_1.prisma.account.create({
        data: {
            id: (0, crypto_1.randomUUID)(),
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: hashed,
        },
    });
    console.log(`Agent user created: ${exports.E2E_AGENT_EMAIL}`);
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await db_1.prisma.$disconnect();
});
//# sourceMappingURL=seed-e2e-agent.js.map