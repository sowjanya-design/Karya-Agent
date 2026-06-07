import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
const u = await prisma.user.findUnique({ where: { email: 'repanajagadish@gmail.com' } });
console.log('User:', JSON.stringify({ uid: u?.uid, email: u?.email, role: u?.role, isApproved: u?.isApproved, hasHash: !!u?.passwordHash }));
if (u?.passwordHash) {
  const match = await bcrypt.compare('RepanaJagadish02', u.passwordHash);
  console.log('Password match:', match);
}
await prisma.$disconnect();
