import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const c = await prisma.client.findUnique({ where: { uid: 'usr_mpzoeqcc5' } });
console.log('Client record:', JSON.stringify(c, null, 2));
await prisma.$disconnect();
