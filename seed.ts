import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const usersToSeed = [
    {
      uid: "admin_1",
      email: "karya.ai.admin@gmail.com",
      displayName: "Karya Admin",
      role: "admin",
      password: "AdminPassword123!"
    }
  ];

  console.log("Seeding fixed users...");

  for (const u of usersToSeed) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        role: u.role,
        uid: u.uid,
        displayName: u.displayName,
        isApproved: true
      },
      create: {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        passwordHash,
        isApproved: true
      }
    });
    console.log(`Seeded user: ${u.email}`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
