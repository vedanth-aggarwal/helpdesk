import "dotenv/config";
import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/db";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists, skipping.`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: "Admin",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const hashed = await hashPassword(password);

  await prisma.account.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashed,
    },
  });

  console.log(`Admin user created: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
