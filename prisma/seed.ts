// Admin users are already in the DB from the initial setup.
// Re-seeding on every deploy is unnecessary and can cause hangs
// if the DB is cold during the build phase.
console.log('[seed] skipping — admin users already exist in DB');
