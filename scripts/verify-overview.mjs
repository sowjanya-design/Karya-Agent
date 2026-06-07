import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();

await page.goto('http://localhost:5173/auth');
await sleep(1500);
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.trim().toUpperCase() === 'CONSULTANT') { await btn.click(); break; }
}
await sleep(300);
await page.fill('input[type="email"]', 'mkarthikeya24@gmail.com');
await page.fill('input[type="password"]', 'Consultancy@2026');
await page.click('button[type="submit"]');
await sleep(3000);
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
}

// Go to Overview
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.trim() === 'Overview') { await btn.click(); await sleep(1000); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/overview-cards.png' });

// Click "Total Candidates" card
const btns = await page.$$('button');
for (const btn of btns) {
  const t = await btn.textContent();
  if (t?.includes('Total Candidates')) { await btn.click(); await sleep(1000); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/overview-popup-candidates.png' });

// Close popup
for (const btn of await page.$$('button')) {
  const box = await btn.boundingBox();
  if (box && box.width < 50) { await btn.click(); await sleep(500); break; }
}

// Click Pending Approvals card
for (const btn of await page.$$('button')) {
  const t = await btn.textContent();
  if (t?.includes('Pending')) { await btn.click(); await sleep(1000); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/overview-popup-pending.png' });

// Go to Candidate Roster, select Yaswanth, click Pipeline tab
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.includes('Candidate Roster')) { await btn.click(); await sleep(1500); break; }
}
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.includes('Application Pipeline')) { await btn.click(); await sleep(1500); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/dossier-pipeline-tab.png' });

const body = await page.textContent('body');
console.log('Has ZEPTO:', body?.includes('ZEPTO'));
console.log('Has pipeline tab in dossier:', body?.includes('Application Pipeline'));
console.log('No sidebar pipeline tab:', !(await page.$$('button')).some ? true : 'check manually');

await browser.close();
