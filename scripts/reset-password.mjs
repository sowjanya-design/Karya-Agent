import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

const newHash = await bcrypt.hash('RepanaJagadish02', 10);
await prisma.user.update({
  where: { email: 'repanajagadish@gmail.com' },
  data: { passwordHash: newHash }
});
console.log('Password reset to RepanaJagadish02 for repanajagadish@gmail.com');
await prisma.$disconnect();
