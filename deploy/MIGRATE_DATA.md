# One-time data migration: Neon → VPS PostgreSQL

Both the old and new databases are Postgres, so this is a native `pg_dump`
/ `pg_restore` — no per-row scripting needed. Do this **after** completing
steps 1–6 of `deploy/VPS_SETUP.md` (app deployed, `npx prisma db push` has
already created the empty schema on the VPS).

Run all of this **on the VPS** (it has normal outbound internet, unlike the
old Hostinger Node.js Web App hosting, so it can reach Neon directly).

## 1. Get your Neon connection string

From your current `.env` or Hostinger's environment variables panel — it
looks like `postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require`.

## 2. Dump data from Neon

```bash
pg_dump "<NEON_DATABASE_URL>" --data-only --disable-triggers -Fc -f ~/karya_data.dump
```

`--data-only` because the schema was already created by `prisma db push` in
VPS_SETUP.md step 5 — this avoids any DDL mismatch between what's in
`schema.prisma` today and whatever Neon's tables drifted to.

## 3. Restore into the local Postgres

```bash
pg_restore --data-only --disable-triggers \
  -h localhost -U karya_user -d karya \
  ~/karya_data.dump
```

You'll be prompted for the `karya_user` password.

## 4. Verify row counts match

Run this against **both** databases and compare:

```bash
psql "<NEON_DATABASE_URL>" -c '
  SELECT '"'"'User'"'"' t, count(*) FROM "User"
  UNION ALL SELECT '"'"'Client'"'"', count(*) FROM "Client"
  UNION ALL SELECT '"'"'ClientJob'"'"', count(*) FROM "ClientJob"
  UNION ALL SELECT '"'"'ResumeHistory'"'"', count(*) FROM "ResumeHistory"
  UNION ALL SELECT '"'"'PreRegistration'"'"', count(*) FROM "PreRegistration";
'

PGPASSWORD='<STRONG_PASSWORD>' psql -h localhost -U karya_user -d karya -c '
  SELECT '"'"'User'"'"' t, count(*) FROM "User"
  UNION ALL SELECT '"'"'Client'"'"', count(*) FROM "Client"
  UNION ALL SELECT '"'"'ClientJob'"'"', count(*) FROM "ClientJob"
  UNION ALL SELECT '"'"'ResumeHistory'"'"', count(*) FROM "ResumeHistory"
  UNION ALL SELECT '"'"'PreRegistration'"'"', count(*) FROM "PreRegistration";
'
```

Every row should match. If `ClientJob` fails to restore because a `Client`
row is missing (foreign key), re-check step 2/3 ran against the full
database, not a partial export.

## 5. Log in and spot-check

Test the login flow in your browser (via the hosts-file trick in
`VPS_SETUP.md` step 8, or after DNS cutover) with a real existing account —
confirm profile data, job applications, etc. all came across.

## 6. Keep Neon around for a rollback window

Don't delete or downgrade the Neon project immediately. Keep it (even on the
free tier — it'll just sleep, which is fine, you're not using it) for about a
week after cutover in case you need to re-check something. After that,
cancel/delete the Neon project.
