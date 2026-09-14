// Seeds (or updates) the single superadmin account from environment
// variables — never hardcode credentials in source. Idempotent: upserts by
// email, so re-running after rotating SUPERADMIN_PASSWORD just updates the
// existing account's password hash instead of creating a duplicate.
//
// Usage: set SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD (and optionally
// SUPERADMIN_NAME) in .env, then run `npm run seed:superadmin`.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL?.trim();
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME?.trim() || "Superadmin";

  if (!email || !password) {
    throw new Error(
      "SUPERADMIN_EMAIL dhe SUPERADMIN_PASSWORD duhen vendosur në .env para se të ekzekutosh këtë skript."
    );
  }
  if (password.length < 8) {
    throw new Error("SUPERADMIN_PASSWORD duhet të ketë të paktën 8 shenja.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "superadmin",
      status: "active",
      name,
    },
    create: {
      email,
      passwordHash,
      name,
      role: "superadmin",
      status: "active",
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Superadmin gati: ${user.email} (id: ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
