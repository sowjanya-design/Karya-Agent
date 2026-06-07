import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Reset to pending_approval so consultant can approve via the UI
await prisma.client.update({ where: { uid: 'usr_mpzoeqcc5' }, data: { status: 'pending_approval' } });
await prisma.user.update({ where: { uid: 'usr_mpzoeqcc5' }, data: { isApproved: false } });
console.log('Reset repana to pending_approval');
await prisma.$disconnect();
