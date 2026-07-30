import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "owner@wealthify.dev";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed skipped — demo owner already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const business = await prisma.business.create({
    data: { name: "Demo Retail Shop", state: "Karnataka", city: "Bengaluru" },
  });

  await prisma.user.create({
    data: {
      businessId: business.id,
      name: "Demo Owner",
      email,
      passwordHash,
      role: "OWNER",
    },
  });

  console.log("Seeded demo business + owner:");
  console.log(`  email:    ${email}`);
  console.log(`  password: password123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
