import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const emps = await p.user.findMany({ where: { role: 'employee' }, select: { email: true, uid: true, displayName: true } });
console.log('Employees:', JSON.stringify(emps, null, 2));
await p.$disconnect();
