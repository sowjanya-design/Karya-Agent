import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const page = await browser.newPage();

// First: assign Yaswanth to a counselor via admin
console.log('=== Admin: assign Yaswanth to Karthik (mkarthikeya24) ===');
await page.goto('http://localhost:5173/auth');
await sleep(2000);

const body0 = await page.textContent('body');
if (body0?.toUpperCase().includes('LOGGED IN')) {
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('SIGN OUT')) { await btn.click(); await sleep(1500); break; }
  }
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

// Click Pending Approvals
for (const btn of await page.$$('button, li, a')) {
  if ((await btn.textContent())?.toLowerCase().includes('pending')) { await btn.click(); await sleep(1000); break; }
}

// Click Yaswanth's card
for (const el of await page.$$('*')) {
  try {
    const txt = await el.textContent();
    if (txt?.includes('Yaswanth') && txt.length < 100) { await el.click(); await sleep(1000); break; }
  } catch {}
}

// Assign to Karthik (mkarthikeya24 = uid "02")
const assignSelect = await page.$('select');
if (assignSelect) {
  // Get all options and pick one with Karthik or uid 02
  const options = await assignSelect.$$('option');
  for (const opt of options) {
    const txt = await opt.textContent();
    if (txt?.includes('Karthik') || txt?.includes('02')) {
      const val = await opt.getAttribute('value');
      await assignSelect.selectOption(val);
      console.log('Selected counselor:', txt);
      break;
    }
  }
  console.log('Selected counselor');
}

await page.screenshot({ path: 'd:/karya/scripts/c1-admin-pending.png' });

// Click Approve Candidate
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('APPROVE')) { await btn.click(); await sleep(2000); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/c2-after-approve.png' });
console.log('Approved and assigned Yaswanth');

// Now login as counselor Karthik
await page.goto('http://localhost:5173/auth');
await sleep(2000);
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('SIGN OUT')) { await btn.click(); await sleep(1500); break; }
}
for (const btn of await page.$$('button')) {
  const txt = (await btn.textContent())?.trim().toUpperCase();
  if (txt === 'CONSULTANT') { await btn.click(); break; }
}
await sleep(400);
await page.fill('input[type="email"]', 'mkarthikeya24@gmail.com');
await page.fill('input[type="password"]', 'Consultancy@2026');
await page.click('button[type="submit"]');
await sleep(3000);
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
}

console.log('Counselor URL:', page.url());
await page.screenshot({ path: 'd:/karya/scripts/c3-counselor-dashboard.png' });

// Click Yaswanth in the list
const listItems = await page.$$('[class*="cursor"], [class*="hover"]');
if (listItems.length > 0) { await listItems[0].click(); await sleep(1500); }

await page.screenshot({ path: 'd:/karya/scripts/c4-yaswanth-in-counselor.png' });
const body = await page.textContent('body');
console.log('Has Yaswanth:', body?.includes('Yaswanth'));
console.log('Has TCS:', body?.includes('Tata Consultancy') || body?.includes('TCS'));
console.log('Has ServiceNow:', body?.includes('Service Now') || body?.includes('ServiceNow'));

await browser.close();
console.log('Done. Check c1-c4 screenshots.');
