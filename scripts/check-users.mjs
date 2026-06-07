import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const users = await p.user.findMany({ where: { role: 'client' }, select: { email: true, uid: true, displayName: true } });
console.log('Current clients:', JSON.stringify(users, null, 2));
await p.$disconnect();
