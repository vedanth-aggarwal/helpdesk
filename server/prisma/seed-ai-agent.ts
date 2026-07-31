// Seeds the system "AI" agent user that tickets get assigned to while the
// auto-resolve pg-boss worker (server/src/lib/autoResolveTicket.ts) is
// attempting to resolve them. No Account/credential row — this user never
// logs in, so a password isn't meaningful. Idempotent, mirrors
// prisma/seed.ts and prisma/seed-e2e-agent.ts. Not part of `npm run seed`;
// run once per environment via `npm run seed:ai-agent`.
import "dotenv/config";
import { prisma } from "../src/db";
import { AI_AGENT_EMAIL } from "../src/lib/aiAgent";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: AI_AGENT_EMAIL } });
  if (existing) {
    console.log(`User ${AI_AGENT_EMAIL} already exists, skipping.`);
    return;
  }

  await prisma.user.create({
    data: {
      email: AI_AGENT_EMAIL,
      name: "AI",
      role: "AGENT",
      emailVerified: true,
    },
  });

  console.log(`AI agent user created: ${AI_AGENT_EMAIL}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
