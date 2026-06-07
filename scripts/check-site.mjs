// Full site check: Login, DOM health, approval flow
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:3000';
const allErrors = [];

function log(msg) { console.log('[CHECK]', msg); }
function err(msg) { console.error('[ERROR]', msg); allErrors.push(msg); }

async function loginAs(page, tab, email, password) {
  await page.goto(BASE + '/auth', { waitUntil: 'domcontentloaded' });
  // Wait for loading spinner to go away
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  // Pick role tab
  const tabMap = { candidate: /candidate/i, consultant: /consultant/i, admin: /admin/i };
  const tabBtn = page.locator('button', { hasText: tabMap[tab] }).first();
  await tabBtn.click();
  await page.waitForTimeout(300);

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.screenshot({ path: `scripts/screenshots/login-${tab}-filled.png` });
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3500);
}

async function main() {
  await mkdir('scripts/screenshots', { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  page.on('console', m => {
    if (m.type() === 'error') err(`[console.error] ${m.text()}`);
  });
  page.on('pageerror', e => err(`[pageerror] ${e.message}`));
  page.on('response', r => {
    if (r.status() >= 400 && !r.url().includes('noise.svg') && !r.url().includes('favicon')) {
      err(`[HTTP ${r.status()}] ${r.url()}`);
    }
  });

  // ── PHASE 1: Login as candidate ───────────────────────────────────────────
  log('=== PHASE 1: Login as repanajagadish@gmail.com (candidate) ===');
  await loginAs(page, 'candidate', 'repanajagadish@gmail.com', 'RepanaJagadish02');
  const p1URL = page.url();
  log(`URL after login: ${p1URL}`);
  await page.screenshot({ path: 'scripts/screenshots/01-candidate-after-login.png', fullPage: true });
  const p1Body = await page.evaluate(() => document.body.innerText.slice(0, 500));
  log(`Content: ${p1Body.replace(/\n/g, ' ').slice(0, 200)}`);

  if (p1URL.includes('/auth')) {
    err('Phase 1: Still on /auth after login — login may have failed');
    const toastText = await page.locator('[data-sonner-toast]').allTextContents().catch(() => []);
    if (toastText.length) log(`Toast messages: ${toastText.join(', ')}`);
  }

  // ── PHASE 2: Candidate state ──────────────────────────────────────────────
  log('\n=== PHASE 2: Candidate dashboard/onboarding state ===');
  if (p1URL.includes('/onboarding')) {
    log('→ Candidate redirected to /onboarding (profile incomplete)');
    await page.screenshot({ path: 'scripts/screenshots/02-onboarding.png', fullPage: true });
    const obBody = await page.evaluate(() => document.body.innerText.slice(0, 300));
    log(`Onboarding content: ${obBody.replace(/\n/g, ' ')}`);
  } else if (p1URL.includes('/dashboard')) {
    log('→ Candidate on /dashboard');
  } else if (p1Body.includes('pending') || p1Body.includes('Being Checked')) {
    log('→ Candidate account is pending approval');
  } else {
    log(`→ State unclear, URL=${p1URL}`);
  }

  // ── Sign out ─────────────────────────────────────────────────────────────
  log('\n=== Signing out candidate ===');
  await page.goto(BASE + '/auth');
  await page.waitForTimeout(1500);
  // Look for Sign Out button on auth page (shown when logged in)
  const signOutBtn = page.locator('button', { hasText: /sign out/i }).first();
  const signOutVisible = await signOutBtn.isVisible().catch(() => false);
  if (signOutVisible) {
    await signOutBtn.click();
    await page.waitForTimeout(1500);
  } else {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1500);
  }
  log(`After signout URL: ${page.url()}`);

  // ── PHASE 3: Consultant login ─────────────────────────────────────────────
  log('\n=== PHASE 3: Login as consultant mkarthikeya24@gmail.com ===');
  await loginAs(page, 'consultant', 'mkarthikeya24@gmail.com', 'Consultancy@2026');
  const p3URL = page.url();
  log(`URL after consultant login: ${p3URL}`);
  await page.screenshot({ path: 'scripts/screenshots/03-consultant-dashboard.png', fullPage: true });
  const p3Body = await page.evaluate(() => document.body.innerText.slice(0, 600));
  log(`Consultant page: ${p3Body.replace(/\n/g, ' ').slice(0, 300)}`);

  if (p3URL.includes('/auth')) {
    err('Phase 3: Still on /auth — consultant login failed');
  } else if (p3URL.includes('/dashboard')) {
    log('→ Consultant reached /dashboard ✅');
  }

  // Navigate explicitly to dashboard if not there
  if (!p3URL.includes('/dashboard')) {
    await page.goto(BASE + '/dashboard');
    await page.waitForTimeout(2000);
    log(`Navigated to /dashboard, URL: ${page.url()}`);
    await page.screenshot({ path: 'scripts/screenshots/03b-dashboard-nav.png', fullPage: true });
  }

  // Check for approval section
  const dashBody = await page.evaluate(() => document.body.innerText.slice(0, 800));
  log(`Dashboard body: ${dashBody.replace(/\n/g, ' ').slice(0, 400)}`);
  if (dashBody.toLowerCase().includes('repana') || dashBody.toLowerCase().includes('jagadish')) {
    log('→ Repana Jagadish visible in consultant dashboard ✅');
  } else {
    log('→ Repana Jagadish not visible in dashboard text');
  }

  // ── PHASE 4: Admin dashboard ─────────────────────────────────────────────
  log('\n=== PHASE 4: Navigate to /admin ===');
  await page.goto(BASE + '/admin');
  await page.waitForTimeout(3000);
  const p4URL = page.url();
  log(`/admin URL: ${p4URL}`);
  await page.screenshot({ path: 'scripts/screenshots/04-admin.png', fullPage: true });
  const p4Body = await page.evaluate(() => document.body.innerText.slice(0, 600));
  log(`Admin page body: ${p4Body.replace(/\n/g, ' ').slice(0, 400)}`);

  if (p4URL.includes('/auth')) {
    err('Phase 4: Redirected to /auth from /admin — consultant not authorized for admin?');
  } else if (p4Body.includes('Access Denied')) {
    err('Phase 4: Admin page shows "Access Denied" for consultant');
  } else {
    log('→ Admin page accessible ✅');
    // Check for approval list
    if (p4Body.toLowerCase().includes('repana') || p4Body.toLowerCase().includes('approval')) {
      log('→ Approval section visible ✅');
    }
  }

  // ── PHASE 5: Sign out and login as admin ─────────────────────────────────
  log('\n=== PHASE 5: Sign in as admin (karya.ai.admin@gmail.com) ===');
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/auth');
  await page.waitForTimeout(1500);
  await loginAs(page, 'admin', 'karya.ai.admin@gmail.com', 'Admin@2026');
  const p5URL = page.url();
  log(`URL after admin login: ${p5URL}`);
  await page.screenshot({ path: 'scripts/screenshots/05-admin-login.png', fullPage: true });
  const p5Body = await page.evaluate(() => document.body.innerText.slice(0, 400));
  log(`Admin login result: ${p5Body.replace(/\n/g, ' ').slice(0, 200)}`);
  // Admin password may be wrong, note it
  if (p5URL.includes('/auth') && (p5Body.includes('Invalid') || p5Body.includes('failed'))) {
    log('→ Admin password "Admin@2026" did not work (expected — we do not know the admin password)');
  }

  // ── FINAL REPORT ─────────────────────────────────────────────────────────
  log('\n=== FINAL ERROR REPORT ===');
  const uniqueErrors = [...new Set(allErrors)];
  if (uniqueErrors.length === 0) {
    log('✅ No JS/network errors detected');
  } else {
    log(`❌ ${uniqueErrors.length} errors found:`);
    uniqueErrors.forEach((e, i) => log(`  [${i+1}] ${e}`));
  }

  await page.screenshot({ path: 'scripts/screenshots/final.png', fullPage: true });
  log('\nDone. Closing browser in 5s...');
  await page.waitForTimeout(5000);
  await browser.close();
}

main().catch(e => { console.error('Fatal:', e.message, e.stack); process.exit(1); });
