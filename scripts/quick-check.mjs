import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

await mkdir('scripts/screenshots', { recursive: true });
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
page.on('response', r => { if (r.status() >= 400) errors.push(`[HTTP ${r.status()}] ${r.url()}`); });

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'scripts/screenshots/quick-01.png', fullPage: true });

const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
console.log('Body text:', bodyText);
console.log('URL:', page.url());
console.log('Errors:', errors);

// Check what's in the DOM
const inputs = await page.evaluate(() =>
  [...document.querySelectorAll('input')].map(i => ({ type: i.type, placeholder: i.placeholder, name: i.name }))
);
console.log('Inputs found:', JSON.stringify(inputs));

await browser.close();
