import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const page = await browser.newPage();

// Login as Karthik
await page.goto('http://localhost:5173/auth');
await sleep(2000);
const b0 = await page.textContent('body');
if (b0?.toUpperCase().includes('LOGGED IN')) {
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('SIGN OUT')) { await btn.click(); await sleep(1500); break; }
  }
}
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

// Click Application Pipeline tab in sidebar
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toLowerCase().includes('pipeline')) { await btn.click(); await sleep(1500); break; }
}

await page.screenshot({ path: 'd:/karya/scripts/pp1-pipeline-page.png' });
const body = await page.textContent('body');
console.log('Has ZEPTO:', body?.includes('ZEPTO'));
console.log('Has Hyderabad:', body?.includes('Hyderabad'));
console.log('Has 11 LPA:', body?.includes('11 LPA'));
console.log('Has APPLIED status:', body?.includes('APPLIED') || body?.includes('Applied'));

await browser.close();
