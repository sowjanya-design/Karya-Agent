import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.user.update({ where: { email: 'repanajagadish@gmail.com' }, data: { isApproved: true } });
console.log('User approved');
await prisma.$disconnect();
