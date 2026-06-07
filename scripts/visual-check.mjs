// Visual check: candidate login + consultant dashboard + admin dashboard
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:3000';
await mkdir('scripts/screenshots', { recursive: true });

const browser = await chromium.launch({ headless: false, slowMo: 60 });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('noise.svg')) errors.push('[JS] ' + m.text()); });
page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
page.on('response', r => {
  if (r.status() >= 400 && !r.url().includes('noise.svg') && !r.url().includes('favicon')) {
    errors.push(`[HTTP ${r.status()}] ${r.url()}`);
  }
});

async function fillLogin(tab, email, pwd) {
  await page.goto(BASE + '/auth', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.locator('button', { hasText: new RegExp(tab, 'i') }).first().click();
  await page.waitForTimeout(300);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pwd);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2500);
}

// ── 1. Candidate login ───────────────────────────────────────────────────────
console.log('=== Check 1: Candidate login ===');
await fillLogin('candidate', 'repanajagadish@gmail.com', 'RepanaJagadish02');
await page.screenshot({ path: 'scripts/screenshots/v01-candidate-auth.png', fullPage: true });
// Click "Go to Dashboard"
const gtd = page.locator('button', { hasText: /go to dashboard/i }).first();
if (await gtd.isVisible().catch(() => false)) {
  await gtd.click();
  await page.waitForTimeout(2000);
  console.log('Navigated to dashboard, URL:', page.url());
  await page.screenshot({ path: 'scripts/screenshots/v02-candidate-dashboard.png', fullPage: true });
}

// ── 2. Consultant login ──────────────────────────────────────────────────────
console.log('\n=== Check 2: Consultant dashboard ===');
await page.evaluate(() => localStorage.clear());
await fillLogin('consultant', 'mkarthikeya24@gmail.com', 'Consultancy@2026');
await page.screenshot({ path: 'scripts/screenshots/v03-consultant-auth.png', fullPage: true });
const gtd2 = page.locator('button', { hasText: /go to dashboard/i }).first();
if (await gtd2.isVisible().catch(() => false)) {
  await gtd2.click();
  await page.waitForTimeout(2500);
}
console.log('Consultant URL:', page.url());
await page.screenshot({ path: 'scripts/screenshots/v04-consultant-dashboard.png', fullPage: true });

const dashText = await page.evaluate(() => document.body.innerText.slice(0, 600));
console.log('Dashboard content:', dashText.replace(/\n/g, ' ').slice(0, 400));

// Navigate to approvals tab
const approvalBtn = page.locator('button', { hasText: /pending approvals/i }).first();
if (await approvalBtn.isVisible().catch(() => false)) {
  await approvalBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/screenshots/v05-consultant-approvals.png', fullPage: true });
  console.log('Approvals tab content:', (await page.evaluate(() => document.body.innerText.slice(0, 500))).replace(/\n/g, ' '));
}

// ── 3. Admin dashboard ───────────────────────────────────────────────────────
console.log('\n=== Check 3: Admin dashboard ===');
await page.goto(BASE + '/admin');
await page.waitForTimeout(3000);
console.log('Admin URL:', page.url());
await page.screenshot({ path: 'scripts/screenshots/v06-admin-overview.png', fullPage: true });

// Click Candidate Roster
const rosterBtn = page.locator('button', { hasText: /candidate roster/i }).first();
if (await rosterBtn.isVisible().catch(() => false)) {
  await rosterBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scripts/screenshots/v07-admin-roster.png', fullPage: true });
  console.log('Roster content:', (await page.evaluate(() => document.body.innerText.slice(0, 600))).replace(/\n/g, ' ').slice(0, 300));
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log('\n=== Errors ===');
const unique = [...new Set(errors)];
if (!unique.length) {
  console.log('✅ No JS/HTTP errors');
} else {
  unique.forEach((e, i) => console.error(`[${i+1}] ${e}`));
}

await page.waitForTimeout(4000);
await browser.close();
