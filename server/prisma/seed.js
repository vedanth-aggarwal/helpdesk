"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const crypto_1 = require("crypto");
const crypto_2 = require("better-auth/crypto");
const db_1 = require("../src/db");
async function main() {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
        throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
    }
    const existing = await db_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`User ${email} already exists, skipping.`);
        return;
    }
    const user = await db_1.prisma.user.create({
        data: {
            email,
            name: "Admin",
            role: "ADMIN",
            emailVerified: true,
        },
    });
    const hashed = await (0, crypto_2.hashPassword)(password);
    await db_1.prisma.account.create({
        data: {
            id: (0, crypto_1.randomUUID)(),
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
    await db_1.prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map