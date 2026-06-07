import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const jobs = await p.clientJob.findMany({ select: { id: true, clientId: true, company: true } });
const clients = await p.client.findMany({ select: { id: true, uid: true } });
console.log('Jobs:', JSON.stringify(jobs, null, 2));
console.log('Clients:', JSON.stringify(clients, null, 2));
await p.$disconnect();
