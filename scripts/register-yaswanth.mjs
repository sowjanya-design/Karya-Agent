import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 600 });
const page = await browser.newPage();

console.log('=== Registering Yaswanth Surya Teja Alapati ===');
await page.goto('http://localhost:5173/auth');
await sleep(2000);

// Candidate tab
for (const btn of await page.$$('button')) {
  const txt = (await btn.textContent())?.trim().toLowerCase();
  if (txt === 'candidate') { await btn.click(); break; }
}
await sleep(500);

// Click "Create account" link
for (const el of await page.$$('button, a, span, p')) {
  const txt = (await el.textContent())?.toLowerCase();
  if (txt?.includes('create account') || txt?.includes('new here')) {
    await el.click(); console.log('Clicked create account'); break;
  }
}
await sleep(1000);

// Get all inputs in order
const inputs = await page.$$('input');
console.log('Input count:', inputs.length);
for (const inp of inputs) {
  const type = await inp.getAttribute('type');
  const placeholder = await inp.getAttribute('placeholder');
  console.log('  input type:', type, 'placeholder:', placeholder);
}

// Fill by placeholder or position
// Full Name = first text input (placeholder: "John Doe")
await page.fill('input[placeholder="John Doe"], input[placeholder*="Doe"]', 'Yaswanth Surya Teja Alapati');
console.log('Filled name');

// Email
await page.fill('input[type="email"]', 'yaswanthalapati17@gmail.com');
console.log('Filled email');

// Password
await page.fill('input[type="password"]', 'yaswanthalapati17');
console.log('Filled password');

await page.screenshot({ path: 'd:/karya/scripts/reg2-filled.png' });

// Submit
await page.click('button[type="submit"], button:has-text("CREATE ACCOUNT"), button:has-text("Create Account")');
await sleep(3500);

await page.screenshot({ path: 'd:/karya/scripts/reg3-after-submit.png' });
console.log('URL after submit:', page.url());
const body = await page.textContent('body');
console.log('Has Yaswanth:', body?.includes('Yaswanth'));
console.log('Logged in card:', body?.toUpperCase().includes('LOGGED IN'));

// Go to dashboard
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) {
    await btn.click(); await sleep(2000); break;
  }
}
await page.screenshot({ path: 'd:/karya/scripts/reg4-dashboard.png' });
console.log('Final URL:', page.url());
await browser.close();
