import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENTS_WITH_JOBS = [
  'usr_0g2e2osbm',
  'usr_cqjwyd6b6',
  'usr_qt8ya5x6k',
  'usr_w2rk08xit',
];

async function main() {
  let total = 0;
  let inserted = 0;
  let errors = 0;

  for (const clientId of CLIENTS_WITH_JOBS) {
    const raw = readFileSync(`C:/Users/Sowjanya/prod_jobs_by_client/${clientId}.json`, 'utf8');
    const jobs = JSON.parse(raw);
    console.log(`\nProcessing ${clientId}: ${jobs.length} jobs`);

    for (const job of jobs) {
      total++;
      try {
        const cid = job.clientId || job.client_id || clientId;

        await prisma.clientJob.upsert({
          where: { id: job.id },
          update: {
            clientId: cid,
            company: job.company || '',
            role: job.role || '',
            status: job.status || 'Applied',
            appliedDate: job.appliedDate || null,
            jobUrl: job.jobUrl || null,
            location: job.location || null,
            salary: job.salary || null,
            tailoredResumeUrl: job.tailoredResumeUrl || null,
          },
          create: {
            id: job.id,
            clientId: cid,
            company: job.company || '',
            role: job.role || '',
            status: job.status || 'Applied',
            appliedDate: job.appliedDate || null,
            jobUrl: job.jobUrl || null,
            location: job.location || null,
            salary: job.salary || null,
            tailoredResumeUrl: job.tailoredResumeUrl || null,
          },
        });
        inserted++;
        process.stdout.write('.');
      } catch (err) {
        console.error(`\nERROR on job ${job.id}: ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`\n\nDone! Total: ${total}, Inserted/Updated: ${inserted}, Errors: ${errors}`);

  const dbCount = await prisma.clientJob.count();
  console.log(`Total jobs in local DB now: ${dbCount}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
