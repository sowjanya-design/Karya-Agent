import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('[ERR]', m.text()); });

// Login as Karthik
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

// Click Candidate Roster then Yaswanth
for (const btn of await page.$$('button, li, a')) {
  if ((await btn.textContent())?.toLowerCase().includes('roster')) { await btn.click(); await sleep(800); break; }
}
for (const el of await page.$$('*')) {
  try {
    const txt = await el.textContent();
    if (txt?.includes('Yaswanth') && txt.length < 80) { await el.click(); await sleep(1000); break; }
  } catch {}
}

// Click Job Applications tab
for (const btn of await page.$$('button')) {
  const txt = (await btn.textContent())?.trim().toLowerCase();
  if (txt?.includes('job application') || txt?.includes('applied jobs')) { await btn.click(); await sleep(800); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/j1-job-tab.png' });

// Click MANUAL button
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.trim().toUpperCase() === 'MANUAL') { await btn.click(); await sleep(600); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/j2-manual-mode.png' });

// Fill the fields by placeholder
const fields = [
  ['E.G. GOOGLE', 'ZEPTO'],
  ['E.G. SOFTWARE E', 'Senior Service Now Developer'],
  ['E.G. LONDON, UK', 'Hyderabad'],
  ['E.G. $140,000', '11 LPA'],
];

for (const [placeholder, value] of fields) {
  const inputs = await page.$$('input');
  for (const inp of inputs) {
    const ph = (await inp.getAttribute('placeholder'))?.toUpperCase();
    if (ph?.includes(placeholder.toUpperCase().slice(0, 10))) {
      await inp.fill(value);
      console.log(`Filled "${placeholder}" → "${value}"`);
      break;
    }
  }
}

await page.screenshot({ path: 'd:/karya/scripts/j3-filled.png' });

// Click SAVE APPLICATION
for (const btn of await page.$$('button')) {
  const txt = (await btn.textContent())?.trim().toUpperCase();
  if (txt?.includes('SAVE APPLICATION') || txt?.includes('SAVE APP')) {
    await btn.click();
    console.log('Clicked SAVE APPLICATION');
    await sleep(2500);
    break;
  }
}
await page.screenshot({ path: 'd:/karya/scripts/j4-after-save.png' });

const body = await page.textContent('body');
console.log('Has ZEPTO:', body?.includes('ZEPTO') || body?.includes('Zepto'));
console.log('Has Senior Service:', body?.includes('Senior Service'));

await browser.close();
