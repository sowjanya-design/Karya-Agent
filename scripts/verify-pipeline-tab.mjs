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

// Go to Candidate Roster
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.trim() === 'Candidate Roster') { await btn.click(); await sleep(1500); break; }
}

// Click Application Pipeline tab in dossier
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.trim() === 'Application Pipeline') { await btn.click(); await sleep(1500); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/dossier-pipeline-tab.png' });

const body = await page.textContent('body');
console.log('Has ZEPTO:', body?.includes('ZEPTO'));
console.log('Has Application Pipeline tab:', body?.includes('Application Pipeline'));

// Check sidebar has NO Application Pipeline button (only Overview + Candidate Roster)
const sidebarBtns = [];
for (const btn of await page.$$('nav button')) {
  sidebarBtns.push((await btn.textContent())?.trim());
}
console.log('Sidebar tabs:', sidebarBtns);

await browser.close();
