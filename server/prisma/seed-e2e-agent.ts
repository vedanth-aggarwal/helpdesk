// One-off seed script for e2e tests: creates a non-admin AGENT user in the
// `helpdesk_test` database so role-gating (AdminRoute) tests have a second
// role to test against. Idempotent — safe to run before every e2e run.
// Invoked directly by e2e/tests specs via `npx dotenv -e .env.test -- npx ts-node --transpile-only prisma/seed-e2e-agent.ts`
// (mirrors the pattern in prisma/seed.ts). Not part of `npm run seed`/`seed:test`.
import "dotenv/config";
import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/db";

export const E2E_AGENT_EMAIL = "agent.e2e@example.com";
export const E2E_AGENT_PASSWORD = "agentPassword123";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: E2E_AGENT_EMAIL },
  });
  if (existing) {
    console.log(`User ${E2E_AGENT_EMAIL} already exists, skipping.`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: E2E_AGENT_EMAIL,
      name: "E2E Agent",
      role: "AGENT",
      emailVerified: true,
    },
  });

  const hashed = await hashPassword(E2E_AGENT_PASSWORD);

  await prisma.account.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashed,
    },
  });

  console.log(`Agent user created: ${E2E_AGENT_EMAIL}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
