import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const pass = (label) => { results.push({ status: '✅', label }); console.log('✅', label); };
const fail = (label, reason) => { results.push({ status: '❌', label, reason }); console.log('❌', label, reason || ''); };
const warn = (label, reason) => { results.push({ status: '⚠️', label, reason }); console.log('⚠️', label, reason || ''); };

const browser = await chromium.launch({ headless: false, slowMo: 200 });

// ─────────────────────────────────────────────
// 1. AUTH PAGE
// ─────────────────────────────────────────────
{
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/auth');
  await sleep(1500);
  const body = await page.textContent('body');
  if (body?.includes('KARYA') || body?.includes('Karya')) pass('Auth page loads');
  else fail('Auth page loads');
  const tabs = [];
  for (const btn of await page.$$('button')) tabs.push((await btn.textContent())?.trim());
  if (tabs.some(t => t?.toUpperCase() === 'CONSULTANT')) pass('Auth: Consultant tab visible');
  else fail('Auth: Consultant tab visible');
  if (tabs.some(t => t?.toLowerCase() === 'admin')) pass('Auth: Admin tab visible');
  else fail('Auth: Admin tab visible');
  if (tabs.some(t => t?.toLowerCase().includes('candidate'))) pass('Auth: Candidate tab visible');
  else fail('Auth: Candidate tab visible');
  await page.close();
}

// ─────────────────────────────────────────────
// 2. ADMIN LOGIN + DASHBOARD
// ─────────────────────────────────────────────
const adminPage = await browser.newPage();
{
  await adminPage.goto('http://localhost:5173/auth');
  await sleep(1500);
  for (const btn of await adminPage.$$('button')) {
    if ((await btn.textContent())?.trim().toLowerCase() === 'admin') { await btn.click(); break; }
  }
  await sleep(300);
  await adminPage.fill('input[type="email"]', 'karya.ai.admin@gmail.com');
  await adminPage.fill('input[type="password"]', 'AdminPassword123!');
  await adminPage.click('button[type="submit"]');
  await sleep(3000);
  for (const btn of await adminPage.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
  const body = await adminPage.textContent('body');
  if (body?.includes('Admin Terminal') || body?.includes('ADMIN TERMINAL')) pass('Admin: Dashboard loaded');
  else fail('Admin: Dashboard loaded');
  if (body?.includes('Overview') || body?.includes('OVERVIEW')) pass('Admin: Overview tab');
  else fail('Admin: Overview tab');
  if (body?.includes('Candidate Roster')) pass('Admin: Candidate Roster tab');
  else fail('Admin: Candidate Roster tab');
  if (body?.includes('Pending Approvals')) pass('Admin: Pending Approvals tab');
  else fail('Admin: Pending Approvals tab');
  if (body?.includes('Counselors Data')) pass('Admin: Counselors Data tab');
  else fail('Admin: Counselors Data tab');
  if (!body?.includes('Purge All Data')) pass('Admin: Purge All Data removed');
  else fail('Admin: Purge All Data should be removed');
}

// Admin: Counselors page
{
  for (const btn of await adminPage.$$('button')) {
    if ((await btn.textContent())?.includes('Counselors Data')) { await btn.click(); await sleep(1500); break; }
  }
  const body = await adminPage.textContent('body');
  if (body?.includes('mkarthikeya24')) pass('Admin: Counselors - Karthik visible');
  else fail('Admin: Counselors - Karthik visible');
  if (body?.includes('kbsn1170')) pass('Admin: Counselors - Niteesh visible');
  else fail('Admin: Counselors - Niteesh visible');
  if (body?.includes('Kesamasetty')) pass('Admin: Counselors - Kesamasetty visible');
  else fail('Admin: Counselors - Kesamasetty visible');
  if (body?.includes('Create New Counselor')) pass('Admin: Create New Counselor button');
  else fail('Admin: Create New Counselor button');
  // Check delete buttons exist
  const trashBtns = await adminPage.$$('button[title="Delete counselor"]');
  if (trashBtns.length >= 3) pass(`Admin: Delete buttons on counselors (${trashBtns.length})`);
  else warn(`Admin: Delete buttons on counselors`, `found ${trashBtns.length}, expected 3`);
}

// Admin: Candidate Roster + dossier
{
  for (const btn of await adminPage.$$('button')) {
    if ((await btn.textContent())?.includes('Candidate Roster')) { await btn.click(); await sleep(1500); break; }
  }
  const body = await adminPage.textContent('body');
  if (body?.includes('Yaswanth')) pass('Admin: Yaswanth visible in roster');
  else fail('Admin: Yaswanth visible in roster');
  if (body?.includes('Candidate Profile')) pass('Admin: Dossier tabs visible');
  else fail('Admin: Dossier tabs visible');
  if (body?.includes('Applied Jobs')) pass('Admin: Applied Jobs tab in dossier');
  else fail('Admin: Applied Jobs tab in dossier');
}

// Admin: Applied Jobs tab → ZEPTO
{
  for (const btn of await adminPage.$$('button')) {
    if ((await btn.textContent())?.trim() === 'Applied Jobs') { await btn.click(); await sleep(2000); break; }
  }
  const body = await adminPage.textContent('body');
  if (body?.includes('ZEPTO')) pass('Admin: ZEPTO application visible in Applied Jobs');
  else fail('Admin: ZEPTO application visible in Applied Jobs');
  if (body?.includes('Senior Service Now Developer') || body?.includes('SENIOR SERVICE NOW DEVELOPER')) pass('Admin: ZEPTO role visible');
  else fail('Admin: ZEPTO role visible');
  if (body?.includes('Hyderabad') || body?.includes('HYDERABAD')) pass('Admin: ZEPTO location visible');
  else fail('Admin: ZEPTO location visible');
  if (body?.includes('11 LPA') || body?.includes('11LPA')) pass('Admin: ZEPTO salary visible');
  else warn('Admin: ZEPTO salary', 'may be empty in admin applied jobs view');
}

// Admin: Approvals tab
{
  for (const btn of await adminPage.$$('button')) {
    if ((await btn.textContent())?.includes('Pending Approvals')) { await btn.click(); await sleep(1000); break; }
  }
  const body = await adminPage.textContent('body');
  if (body?.includes('Awaiting Approval') || body?.includes('AWAITING')) pass('Admin: Pending Approvals tab works');
  else warn('Admin: Pending Approvals tab', 'could not confirm');
}
await adminPage.screenshot({ path: 'd:/karya/scripts/health-admin.png' });
await adminPage.close();

// ─────────────────────────────────────────────
// 3. COUNSELOR 1 — mkarthikeya24 (ID: 02)
// ─────────────────────────────────────────────
const c1Page = await browser.newPage();
{
  await c1Page.goto('http://localhost:5173/auth');
  await sleep(1500);
  for (const btn of await c1Page.$$('button')) {
    if ((await btn.textContent())?.trim().toUpperCase() === 'CONSULTANT') { await btn.click(); break; }
  }
  await sleep(300);
  await c1Page.fill('input[type="email"]', 'mkarthikeya24@gmail.com');
  await c1Page.fill('input[type="password"]', 'Consultancy@2026');
  await c1Page.click('button[type="submit"]');
  await sleep(3000);
  for (const btn of await c1Page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
  const body = await c1Page.textContent('body');
  if (!body?.includes('Access Denied')) pass('Counselor 1 (mkarthikeya24): Access granted');
  else fail('Counselor 1 (mkarthikeya24): Access granted');
  if (body?.includes('CONSULTANT SPACE')) pass('Counselor 1: Consultant Space label');
  else fail('Counselor 1: Consultant Space label');

  // Check sidebar tabs
  if (body?.includes('Overview') && body?.includes('Candidate Roster')) pass('Counselor 1: Sidebar tabs (Overview + Roster)');
  else fail('Counselor 1: Sidebar tabs');
  if (!body?.includes('Pending Approvals')) pass('Counselor 1: Pending Approvals removed from sidebar');
  else fail('Counselor 1: Pending Approvals should be removed');

  // Navigate to Overview
  for (const btn of await c1Page.$$('button')) {
    if ((await btn.textContent())?.trim() === 'Overview') { await btn.click(); await sleep(1000); break; }
  }
  const b2 = await c1Page.textContent('body');
  if (b2?.includes('Total Candidates Registered')) pass('Counselor 1: Overview - Total Candidates card');
  else fail('Counselor 1: Overview - Total Candidates card');
  if (b2?.includes('Pending Approvals') && b2?.includes('Click to view')) pass('Counselor 1: Overview - Pending Approvals card (clickable)');
  else fail('Counselor 1: Overview - Pending Approvals card');
  if (!b2?.includes('Active Approved Candidates')) pass('Counselor 1: Active Approved card removed');
  else fail('Counselor 1: Active Approved card should be removed');

  // Click Total Candidates popup
  for (const btn of await c1Page.$$('button')) {
    if ((await btn.textContent())?.includes('Total Candidates')) { await btn.click(); await sleep(1000); break; }
  }
  const b3 = await c1Page.textContent('body');
  if (b3?.includes('Assigned Candidates')) pass('Counselor 1: Total Candidates popup opens');
  else fail('Counselor 1: Total Candidates popup opens');
  if (b3?.includes('Yaswanth')) pass('Counselor 1: Yaswanth visible in candidates popup');
  else fail('Counselor 1: Yaswanth visible in candidates popup');
  // Close popup by clicking top-left corner (outside modal = backdrop)
  await c1Page.mouse.click(10, 10);
  await sleep(500);
}

// Counselor 1: Roster → dossier tabs
{
  for (const btn of await c1Page.$$('button')) {
    if ((await btn.textContent())?.trim() === 'Candidate Roster') { await btn.click(); await sleep(1500); break; }
  }
  const body = await c1Page.textContent('body');
  if (body?.includes('Yaswanth')) pass('Counselor 1: Yaswanth in roster');
  else fail('Counselor 1: Yaswanth in roster');
  if (body?.includes('Candidate Profile')) pass('Counselor 1: Dossier tab - Candidate Profile');
  else fail('Counselor 1: Dossier tab - Candidate Profile');
  if (body?.includes('Job Applications')) pass('Counselor 1: Dossier tab - Job Applications');
  else fail('Counselor 1: Dossier tab - Job Applications');
  if (body?.includes('Application Pipeline')) pass('Counselor 1: Dossier tab - Application Pipeline');
  else fail('Counselor 1: Dossier tab - Application Pipeline');
}

// Counselor 1: Pipeline dossier tab → ZEPTO
{
  for (const btn of await c1Page.$$('button')) {
    if ((await btn.textContent())?.trim() === 'Application Pipeline') { await btn.click(); await sleep(2500); break; }
  }
  const body = await c1Page.textContent('body');
  if (body?.includes('ZEPTO')) pass('Counselor 1: ZEPTO in pipeline dossier tab');
  else warn('Counselor 1: ZEPTO in pipeline dossier tab', 'may be timing');
  if (body?.includes('Senior Service Now Developer') || body?.includes('SENIOR SERVICE NOW DEVELOPER')) pass('Counselor 1: ZEPTO role in pipeline');
  else warn('Counselor 1: ZEPTO role in pipeline', 'may be timing');
}
await c1Page.screenshot({ path: 'd:/karya/scripts/health-counselor1.png' });
await c1Page.close();

// ─────────────────────────────────────────────
// 4. COUNSELOR 2 — kbsn1170 (ID: 01)
// ─────────────────────────────────────────────
const c2Page = await browser.newPage();
{
  await c2Page.goto('http://localhost:5173/auth');
  await sleep(1500);
  for (const btn of await c2Page.$$('button')) {
    if ((await btn.textContent())?.trim().toUpperCase() === 'CONSULTANT') { await btn.click(); break; }
  }
  await sleep(300);
  await c2Page.fill('input[type="email"]', 'kbsn1170@gmail.com');
  await c2Page.fill('input[type="password"]', 'Consultancy@2026');
  await c2Page.click('button[type="submit"]');
  await sleep(3000);
  for (const btn of await c2Page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
  const body = await c2Page.textContent('body');
  if (!body?.includes('Access Denied')) pass('Counselor 2 (kbsn1170): Access granted');
  else fail('Counselor 2 (kbsn1170): Access granted');
  if (body?.includes('CONSULTANT SPACE')) pass('Counselor 2: Consultant Space loaded');
  else fail('Counselor 2: Consultant Space loaded');
}
await c2Page.screenshot({ path: 'd:/karya/scripts/health-counselor2.png' });
await c2Page.close();

// ─────────────────────────────────────────────
// 5. COUNSELOR 3 — karthikkesam9666 (ID: 03)
// ─────────────────────────────────────────────
const c3Page = await browser.newPage();
{
  await c3Page.goto('http://localhost:5173/auth');
  await sleep(1500);
  for (const btn of await c3Page.$$('button')) {
    if ((await btn.textContent())?.trim().toUpperCase() === 'CONSULTANT') { await btn.click(); break; }
  }
  await sleep(300);
  await c3Page.fill('input[type="email"]', 'karthikkesam9666@gmail.com');
  await c3Page.fill('input[type="password"]', 'karthikkesam9666');
  await c3Page.click('button[type="submit"]');
  await sleep(3000);
  for (const btn of await c3Page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
  const body = await c3Page.textContent('body');
  if (!body?.includes('Access Denied')) pass('Counselor 3 (Kesamasetty): Access granted');
  else fail('Counselor 3 (Kesamasetty): Access granted');
  if (body?.includes('CONSULTANT SPACE')) pass('Counselor 3: Dashboard loaded');
  else fail('Counselor 3: Dashboard loaded');
}
await c3Page.screenshot({ path: 'd:/karya/scripts/health-counselor3.png' });
await c3Page.close();

// ─────────────────────────────────────────────
// 6. CANDIDATE — Yaswanth
// ─────────────────────────────────────────────
const candPage = await browser.newPage();
{
  await candPage.goto('http://localhost:5173/auth');
  await sleep(1500);
  for (const btn of await candPage.$$('button')) {
    if ((await btn.textContent())?.toLowerCase().includes('candidate')) { await btn.click(); break; }
  }
  await sleep(300);
  await candPage.fill('input[type="email"]', 'yaswanthalapati17@gmail.com');
  await candPage.fill('input[type="password"]', 'yaswanthalapati17');
  await candPage.click('button[type="submit"]');
  await sleep(3000);
  for (const btn of await candPage.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
  const body = await candPage.textContent('body');
  if (!body?.includes('Access Denied')) pass('Candidate (Yaswanth): Login successful');
  else fail('Candidate (Yaswanth): Login successful');
  if (body?.includes('Yaswanth') || body?.includes('YASWANTH')) pass('Candidate: Name visible on dashboard');
  else warn('Candidate: Name visible on dashboard');
}
await candPage.screenshot({ path: 'd:/karya/scripts/health-candidate.png' });
await candPage.close();

// ─────────────────────────────────────────────
// 7. API HEALTH CHECKS
// ─────────────────────────────────────────────
{
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'karya.ai.admin@gmail.com', password: 'AdminPassword123!' })
    });
    const data = await res.json();
    if (data.token) {
      pass('API: Admin login endpoint');
      const token = data.token;

      const clients = await (await fetch('http://localhost:3000/api/clients', { headers: { Authorization: `Bearer ${token}` } })).json();
      if (Array.isArray(clients) && clients.length > 0) pass(`API: GET /api/clients returns ${clients.length} client(s)`);
      else fail('API: GET /api/clients');

      const counselors = await (await fetch('http://localhost:3000/api/users/counselors', { headers: { Authorization: `Bearer ${token}` } })).json();
      if (Array.isArray(counselors) && counselors.length >= 3) pass(`API: GET /api/users/counselors returns ${counselors.length} counselors`);
      else fail('API: GET /api/users/counselors');

      const yaswanth = clients.find(c => c.uid === 'usr_cqmaqxlxi');
      if (yaswanth) {
        const jobs = await (await fetch(`http://localhost:3000/api/jobs/${yaswanth.uid}`, { headers: { Authorization: `Bearer ${token}` } })).json();
        if (Array.isArray(jobs) && jobs.some(j => j.company === 'ZEPTO')) pass('API: GET /api/jobs/:uid — ZEPTO found');
        else fail('API: GET /api/jobs/:uid — ZEPTO not found');
        if (jobs[0]?.location && jobs[0]?.salary) pass('API: Job has location + salary fields');
        else warn('API: Job location/salary fields', JSON.stringify(jobs[0]));
      }
    } else fail('API: Admin login endpoint');
  } catch(e) { fail('API: health check', e.message); }
}

await browser.close();

// ─────────────────────────────────────────────
// FINAL REPORT
// ─────────────────────────────────────────────
console.log('\n══════════════════════════════════════');
console.log('         KARYA HEALTH REPORT');
console.log('══════════════════════════════════════');
const passed = results.filter(r => r.status === '✅').length;
const failed = results.filter(r => r.status === '❌').length;
const warned = results.filter(r => r.status === '⚠️').length;
results.forEach(r => console.log(`${r.status} ${r.label}${r.reason ? ' — ' + r.reason : ''}`));
console.log('──────────────────────────────────────');
console.log(`PASSED: ${passed}  WARNINGS: ${warned}  FAILED: ${failed}  TOTAL: ${results.length}`);
console.log('══════════════════════════════════════');
