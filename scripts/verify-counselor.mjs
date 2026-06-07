import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const page = await browser.newPage();

// Login as counselor Karthik
await page.goto('http://localhost:5173/auth');
await sleep(2000);

const body0 = await page.textContent('body');
if (body0?.toUpperCase().includes('LOGGED IN')) {
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('SIGN OUT')) { await btn.click(); await sleep(1500); break; }
  }
}

for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.trim().toUpperCase() === 'CONSULTANT') { await btn.click(); break; }
}
await sleep(400);
await page.fill('input[type="email"]', 'mkarthikeya24@gmail.com');
await page.fill('input[type="password"]', 'Consultancy@2026');
await page.click('button[type="submit"]');
await sleep(3000);
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
}

console.log('URL:', page.url());
await page.screenshot({ path: 'd:/karya/scripts/v1-counselor.png' });

// Click Candidate Roster
for (const btn of await page.$$('button, li, a')) {
  if ((await btn.textContent())?.toLowerCase().includes('roster')) { await btn.click(); await sleep(1000); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/v2-roster.png' });

const body = await page.textContent('body');
console.log('Has Yaswanth:', body?.includes('Yaswanth'));
console.log('Has Pending Approvals tab:', body?.includes('Pending Approvals'));
console.log('No candidates msg:', body?.includes('NO CANDIDATES FOUND'));

// Click Yaswanth if visible
for (const el of await page.$$('*')) {
  try {
    const txt = await el.textContent();
    if (txt?.includes('Yaswanth') && txt.length < 80) { await el.click(); await sleep(1000); break; }
  } catch {}
}
await page.screenshot({ path: 'd:/karya/scripts/v3-yaswanth-dossier.png' });

await browser.close();
