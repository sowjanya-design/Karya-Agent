import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const clients = await p.client.findMany({ select: { uid: true, id: true, status: true, assignedEmployeeId: true } });
console.log('All clients in DB:', JSON.stringify(clients, null, 2));
await p.$disconnect();
