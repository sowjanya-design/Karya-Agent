import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const admins = await p.user.findMany({ where: { role: 'admin' }, select: { email: true, uid: true } });
console.log(JSON.stringify(admins, null, 2));
await p.$disconnect();
