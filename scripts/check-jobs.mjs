import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const jobs = await p.clientJob.findMany({ select: { id: true, company: true, role: true, status: true, location: true, salary: true, appliedDate: true } });
console.log('All jobs:', JSON.stringify(jobs, null, 2));
await p.$disconnect();
