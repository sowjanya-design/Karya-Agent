import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();

await page.goto('http://localhost:5173/auth');
await sleep(1500);

for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.trim().toLowerCase() === 'admin') { await btn.click(); break; }
}
await sleep(300);
await page.fill('input[type="email"]', 'karya.ai.admin@gmail.com');
await page.fill('input[type="password"]', 'AdminPassword123!');
await page.click('button[type="submit"]');
await sleep(3000);

for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
}

// Click Counselors Data tab
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toLowerCase().includes('counselor')) { await btn.click(); await sleep(1500); break; }
}

await page.screenshot({ path: 'd:/karya/scripts/admin-counselors.png' });
const body = await page.textContent('body');
console.log('Has mkarthikeya24:', body?.includes('mkarthikeya24'));
console.log('Has kbsn1170:', body?.includes('kbsn1170'));
console.log('Has Kesamasetty:', body?.includes('Kesamasetty'));
console.log('Has karthikkesam:', body?.includes('karthikkesam'));

await browser.close();
