import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admins = [
    { uid: 'admin_01', email: 'karya.ai.admin@gmail.com', displayName: 'Karya Admin', password: 'AdminPassword123!' },
    { uid: 'admin_02', email: 'karya.secret.admin@gmail.com', displayName: 'Karya Admin 2', password: 'AdminPassword123!' },
    { uid: 'admin_03', email: 'avinashmurari3@gmail.com', displayName: 'Karya Admin 3', password: 'Avinash@001' },
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

  console.log('Admin accounts seeded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
