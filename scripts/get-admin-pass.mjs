import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const u = await p.user.findFirst({ where: { email: 'karya.ai.admin@gmail.com' }, select: { passwordHash: true } });
console.log('hash:', u?.passwordHash);
await p.$disconnect();
