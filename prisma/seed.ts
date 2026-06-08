import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const admins = [
    { uid: 'admin_01', email: 'karya.ai.admin@gmail.com', displayName: 'Karya Admin', password: 'AdminPassword123!' },
    { uid: 'admin_02', email: 'karya.secret.admin@gmail.com', displayName: 'Karya Admin 2', password: 'AdminPassword123!' },
    { uid: 'admin_03', email: 'mkarthikeya24@gmail.com', displayName: 'Admin MK', password: 'AdminPassword123!' },
    { uid: 'admin_04', email: 'kbsn1170@gmail.com', displayName: 'Admin KBS', password: 'AdminPassword123!' },
  ];

  for (const admin of admins) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    await prisma.user.upsert({
      where: { email: admin.email },
      update: { passwordHash, role: 'admin', isApproved: true },
      create: {
        uid: admin.uid,
        email: admin.email,
        displayName: admin.displayName,
        role: 'admin',
        isApproved: true,
        passwordHash,
      },
    });
    console.log(`✓ ${admin.email}`);
  }

  console.log('\nAdmin accounts seeded. Password for all: AdminPassword123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
