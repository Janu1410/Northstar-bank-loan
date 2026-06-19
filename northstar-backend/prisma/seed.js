import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME?.trim();
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  const adminRole = process.env.SEED_ADMIN_ROLE?.trim() || "MANAGER";

  if (!adminName || !adminEmail || !adminPassword) {
    throw new Error(
      "Missing seed admin env vars. Set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD.",
    );
  }

  if (adminPassword.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      name: adminName,
      passwordHash,
      role: adminRole,
      isActive: true,
      passwordChangeRequired: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: adminRole,
      isActive: true,
      passwordChangeRequired: true,
    },
    select: {
      email: true,
      role: true,
      passwordChangeRequired: true,
    },
  });

  console.log("Seeded initial admin:", admin);
}

main()
  .catch((error) => {
    console.error("Admin seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
