import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const admins = [
    { uid: 'admin_01', email: 'karya.ai.admin@gmail.com', displayName: 'Karya Admin', password: 'AdminPassword123!' },
    { uid: 'admin_02', email: 'karya.secret.admin@gmail.com', displayName: 'Karya Admin 2', password: 'AdminPassword123!' },
    { uid: 'admin_03', email: 'avinashmurari3@gmail.com', displayName: 'Karya Admin 3', password: 'Avinash@001' },
  ];

  for (const admin of admins) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    await sql`
      INSERT INTO "User" (uid, email, "displayName", role, "isApproved", "passwordHash", "createdAt", "updatedAt")
      VALUES (
        ${admin.uid}, ${admin.email}, ${admin.displayName},
        'admin', true, ${passwordHash}, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        "passwordHash" = ${passwordHash},
        role = 'admin',
        "isApproved" = true,
        "updatedAt" = NOW()
    `;
    console.log(`✓ ${admin.email}`);
  }

  console.log('Admin accounts seeded.');
}

main().catch(e => { console.error(e); process.exit(1); });
