import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();

// Login as Karthik
await page.goto('http://localhost:5173/auth');
await sleep(2000);

// Sign out if needed
const b0 = await page.textContent('body');
if (b0?.toUpperCase().includes('LOGGED IN') || b0?.toUpperCase().includes('SIGN OUT')) {
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('SIGN OUT')) { await btn.click(); await sleep(1500); break; }
  }
}

// Select Consultant tab
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.trim().toUpperCase() === 'CONSULTANT') { await btn.click(); break; }
}
await sleep(300);

await page.fill('input[type="email"]', 'mkarthikeya24@gmail.com');
await page.fill('input[type="password"]', 'Consultancy@2026');
await page.click('button[type="submit"]');
await sleep(3000);

// Click dashboard if shown
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
}

// Click Application Pipeline tab
let clicked = false;
for (const btn of await page.$$('button')) {
  const t = await btn.textContent();
  if (t?.toLowerCase().includes('application pipeline') || t?.toLowerCase().includes('pipeline')) {
    await btn.click();
    clicked = true;
    console.log('Clicked pipeline tab:', t?.trim());
    break;
  }
}
if (!clicked) console.log('WARNING: pipeline tab not found');
await sleep(2000);

// Explicitly select Yaswanth from dropdown if present
try {
  const select = await page.$('select');
  if (select) {
    const options = await select.$$('option');
    for (const opt of options) {
      const val = await opt.getAttribute('value');
      const text = await opt.textContent();
      console.log('Option:', val, text);
    }
    // Select by value (first option should be Yaswanth)
    await select.selectOption({ index: 0 });
    await sleep(2500);
  } else {
    console.log('No select element found');
  }
} catch(e) {
  console.log('Dropdown error:', e.message);
}

await page.screenshot({ path: 'd:/karya/scripts/pp2-pipeline.png' });
const body = await page.textContent('body');
console.log('Has ZEPTO:', body?.includes('ZEPTO'));
console.log('Has Hyderabad:', body?.includes('Hyderabad'));
console.log('Has 11 LPA:', body?.includes('11 LPA'));
console.log('Has Senior Service:', body?.includes('Senior Service'));

await browser.close();
