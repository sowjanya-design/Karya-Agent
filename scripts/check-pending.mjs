import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 600 });
const page = await browser.newPage();

// Admin login
await page.goto('http://localhost:5173/auth');
await sleep(2000);

const body0 = await page.textContent('body');
if (body0?.toUpperCase().includes('LOGGED IN')) {
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
} else {
  // Sign out any existing session first
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('SIGN OUT')) { await btn.click(); await sleep(1000); break; }
  }
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.trim().toLowerCase() === 'admin') { await btn.click(); break; }
  }
  await sleep(400);
  await page.fill('input[type="email"]', 'karya.ai.admin@gmail.com');
  await page.fill('input[type="password"]', 'AdminPassword123!');
  await page.click('button[type="submit"]');
  await sleep(3000);
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
}

console.log('Admin URL:', page.url());

// Click Pending Approvals
for (const btn of await page.$$('button, a, li')) {
  if ((await btn.textContent())?.toLowerCase().includes('pending')) { await btn.click(); await sleep(1000); break; }
}

await page.screenshot({ path: 'd:/karya/scripts/pending1-admin.png' });
const adminBody = await page.textContent('body');
console.log('Has Yaswanth in pending:', adminBody?.includes('Yaswanth'));
console.log('Has Surya Teja:', adminBody?.includes('Surya'));

await browser.close();
