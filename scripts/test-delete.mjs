import { chromium } from 'playwright';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const page = await browser.newPage();

page.on('console', m => console.log('[BROWSER]', m.text()));

// --- ADMIN: delete first candidate (253c6303) ---
console.log('\n=== ADMIN LOGIN ===');
await page.goto('http://localhost:5173/auth');
await sleep(1500);

// Click Admin tab
const tabs = await page.$$('button');
for (const t of tabs) {
  const txt = await t.textContent();
  if (txt?.toLowerCase().includes('admin')) { await t.click(); break; }
}
await sleep(500);

await page.fill('input[type="email"], input[placeholder*="mail" i]', 'karya.ai.admin@gmail.com');
await page.fill('input[type="password"], input[placeholder*="pass" i]', 'Admin@Karya2025');
await page.click('button[type="submit"]');
await sleep(3000);

// Click "Go to Dashboard" if present
const goBtn = await page.$('button:has-text("Go to Dashboard"), a:has-text("Go to Dashboard")');
if (goBtn) { await goBtn.click(); await sleep(2000); }

console.log('Current URL:', page.url());

// Find candidate 253c6303 in the list and click it
const allItems = await page.$$('[class*="cursor-pointer"], [class*="hover"]');
let clicked = false;
for (const item of allItems) {
  const txt = await item.textContent();
  if (txt?.includes('253c6303') || txt?.includes('31604')) {
    await item.click();
    clicked = true;
    console.log('Clicked candidate 253c6303');
    break;
  }
}
if (!clicked) console.log('WARNING: Could not find 253c6303 candidate row');
await sleep(1500);

// Look for trash/delete button in dossier panel
const trashBtns = await page.$$('button[title*="emove" i], button[title*="elete" i], button[title*="ermanent" i]');
console.log('Trash buttons found:', trashBtns.length);

if (trashBtns.length > 0) {
  // Set up dialog handler BEFORE clicking
  page.once('dialog', async dialog => {
    console.log('Dialog message:', dialog.message());
    await dialog.accept();
    console.log('Accepted dialog');
  });
  await trashBtns[0].click();
  console.log('Clicked trash button');
  await sleep(2000);
  console.log('URL after delete:', page.url());
} else {
  // Try finding by SVG or aria
  const svgBtns = await page.$$('button svg');
  console.log('SVG buttons count:', svgBtns.length);

  // Screenshot for debugging
  await page.screenshot({ path: 'd:/karya/scripts/admin-state.png' });
  console.log('Screenshot saved to admin-state.png');
}

// Check if still visible
const body = await page.textContent('body');
if (body?.includes('253c6303')) {
  console.log('FAIL: 253c6303 still visible after delete attempt');
} else {
  console.log('SUCCESS: 253c6303 no longer visible');
}

await browser.close();
