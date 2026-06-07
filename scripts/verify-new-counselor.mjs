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
await page.fill('input[type="email"]', 'karthikkesam9666@gmail.com');
await page.fill('input[type="password"]', 'karthikkesam9666');
await page.click('button[type="submit"]');
await sleep(3000);

for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
}

await page.screenshot({ path: 'd:/karya/scripts/new-counselor-login.png' });
const body = await page.textContent('body');
console.log('Access Denied shown:', body?.includes('Access Denied'));
console.log('Dashboard visible:', body?.includes('Overview') || body?.includes('Candidate Roster'));
console.log('Consultant Space:', body?.includes('CONSULTANT SPACE') || body?.includes('Consultant'));

await browser.close();
