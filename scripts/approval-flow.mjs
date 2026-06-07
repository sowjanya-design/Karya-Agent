// Phase 3: Consultant approval flow + full page check
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:3000';
await mkdir('scripts/screenshots', { recursive: true });

const browser = await chromium.launch({ headless: false, slowMo: 80 });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('[JS] ' + m.text()); });
page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
page.on('response', r => {
  if (r.status() >= 400 && !r.url().includes('noise.svg') && !r.url().includes('favicon'))
    errors.push(`[HTTP ${r.status()}] ${r.url()}`);
});

async function login(tab, email, pwd) {
  await page.goto(BASE + '/auth', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.locator('button', { hasText: new RegExp(tab, 'i') }).first().click();
  await page.waitForTimeout(300);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pwd);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2500);
  // Click "Go to Dashboard" if shown
  const gtd = page.locator('button', { hasText: /go to dashboard/i }).first();
  if (await gtd.isVisible().catch(() => false)) {
    await gtd.click();
    await page.waitForTimeout(2000);
  }
}

// ── Phase 3: Consultant approves Repana ─────────────────────────────────────
console.log('=== PHASE 3: Consultant approval flow ===');
await login('consultant', 'mkarthikeya24@gmail.com', 'Consultancy@2026');
console.log('URL:', page.url());
await page.screenshot({ path: 'scripts/screenshots/ap01-consultant-dash.png', fullPage: true });

// Click "Pending Approvals"
await page.locator('button', { hasText: /pending approvals/i }).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scripts/screenshots/ap02-pending-approvals.png', fullPage: true });
const appText = await page.evaluate(() => document.body.innerText.slice(0, 600));
console.log('Approvals tab:', appText.replace(/\n/g, ' ').slice(0, 300));

// Check if Repana is visible in the list
const repanaItem = page.locator('text=Repana Jagadish').first();
const repanaVisible = await repanaItem.isVisible().catch(() => false);
if (repanaVisible) {
  console.log('✅ Repana Jagadish found in pending approvals');
  await repanaItem.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/screenshots/ap03-repana-selected.png', fullPage: true });

  // Approve button
  const approveBtn = page.locator('button', { hasText: /approve/i }).first();
  if (await approveBtn.isVisible().catch(() => false)) {
    console.log('Clicking approve button...');
    await approveBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'scripts/screenshots/ap04-after-approval.png', fullPage: true });
    const afterText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log('After approval:', afterText.replace(/\n/g, ' ').slice(0, 200));
    console.log('✅ Approval action triggered');
  } else {
    console.log('❌ Approve button not found');
  }
} else {
  console.log('❌ Repana Jagadish not found in pending approvals');
  console.log('Full page text:', appText.replace(/\n/g, ' '));
}

// ── Admin dashboard after approval ──────────────────────────────────────────
console.log('\n=== Admin dashboard post-approval check ===');
await page.goto(BASE + '/admin');
await page.waitForTimeout(3000);
await page.screenshot({ path: 'scripts/screenshots/ap05-admin-post-approval.png', fullPage: true });

// Click Pending Approvals in admin
await page.locator('button', { hasText: /pending approvals/i }).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scripts/screenshots/ap06-admin-pending.png', fullPage: true });
const adminPending = await page.evaluate(() => document.body.innerText.slice(200, 700));
console.log('Admin pending approvals:', adminPending.replace(/\n/g, ' ').slice(0, 300));

// ── Verify candidate can now log in ─────────────────────────────────────────
console.log('\n=== Verify candidate login after approval ===');
await page.evaluate(() => localStorage.clear());
await login('candidate', 'repanajagadish@gmail.com', 'RepanaJagadish02');
console.log('Candidate URL after approval:', page.url());
await page.screenshot({ path: 'scripts/screenshots/ap07-candidate-post-approval.png', fullPage: true });

// ── Error report ─────────────────────────────────────────────────────────────
console.log('\n=== ERRORS ===');
const unique = [...new Set(errors)];
if (!unique.length) console.log('✅ No JS/HTTP errors detected');
else unique.forEach((e, i) => console.error(`[${i+1}] ${e}`));

await page.waitForTimeout(4000);
await browser.close();
