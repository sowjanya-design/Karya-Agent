import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const users = await p.user.findMany({ where: { role: 'client' }, select: { email: true, uid: true, displayName: true } });
console.log('Client users:', JSON.stringify(users, null, 2));
const clients = await p.client.findMany({ select: { uid: true, status: true, applicationData: true } });
console.log('Client records:', JSON.stringify(clients, null, 2));
await p.$disconnect();
