// Admin accounts are created/refreshed by ensureAdmins() at server startup
// (see server.ts). No build-phase seeding needed — this is a no-op so
// postinstall never fails on the DB.
console.log('[seed] no-op — admins are ensured at server startup');
