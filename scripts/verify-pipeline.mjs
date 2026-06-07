import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 500 });

// === Counselor: check pipeline shows ZEPTO ===
{
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/auth');
  await sleep(2000);
  const b0 = await page.textContent('body');
  if (b0?.toUpperCase().includes('LOGGED IN')) {
    for (const btn of await page.$$('button')) {
      if ((await btn.textContent())?.toUpperCase().includes('SIGN OUT')) { await btn.click(); await sleep(1500); break; }
    }
  }
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.trim().toUpperCase() === 'CONSULTANT') { await btn.click(); break; }
  }
  await sleep(300);
  await page.fill('input[type="email"]', 'mkarthikeya24@gmail.com');
  await page.fill('input[type="password"]', 'Consultancy@2026');
  await page.click('button[type="submit"]');
  await sleep(3000);
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
  for (const el of await page.$$('*')) {
    try { const t = await el.textContent(); if (t?.includes('Yaswanth') && t.length < 80) { await el.click(); await sleep(800); break; } } catch {}
  }
  // Click Job Applications tab
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toLowerCase().includes('job application')) { await btn.click(); await sleep(1000); break; }
  }
  await page.screenshot({ path: 'd:/karya/scripts/pipe1-counselor.png' });
  console.log('Counselor - Has ZEPTO:', (await page.textContent('body'))?.includes('ZEPTO'));
  await page.close();
}

// === Admin: check ZEPTO shows in overview/applied jobs ===
{
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/auth');
  await sleep(2000);
  const b0 = await page.textContent('body');
  if (b0?.toUpperCase().includes('LOGGED IN')) {
    for (const btn of await page.$$('button')) {
      if ((await btn.textContent())?.toUpperCase().includes('SIGN OUT')) { await btn.click(); await sleep(1500); break; }
    }
  }
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
  // Click Candidate Roster → Yaswanth → Applied Jobs tab
  for (const btn of await page.$$('button, li')) {
    if ((await btn.textContent())?.toLowerCase().includes('roster')) { await btn.click(); await sleep(800); break; }
  }
  for (const el of await page.$$('*')) {
    try { const t = await el.textContent(); if (t?.includes('Yaswanth') && t.length < 80) { await el.click(); await sleep(800); break; } } catch {}
  }
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toLowerCase().includes('applied jobs')) { await btn.click(); await sleep(1000); break; }
  }
  await page.screenshot({ path: 'd:/karya/scripts/pipe2-admin.png' });
  console.log('Admin - Has ZEPTO:', (await page.textContent('body'))?.includes('ZEPTO'));
  await page.close();
}

await browser.close();
console.log('Done. Check pipe1 and pipe2 screenshots.');
