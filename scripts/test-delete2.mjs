import { chromium } from 'playwright';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 600 });

// ===== PART 1: Admin deletes 253c6303 candidate =====
{
  const page = await browser.newPage();
  page.on('console', m => { if (!m.text().includes('vite') && !m.text().includes('React')) console.log('[BROWSER]', m.text()); });

  console.log('\n=== ADMIN: Login ===');
  await page.goto('http://localhost:5173/auth');
  await sleep(2000);

  // Click Admin tab
  for (const t of await page.$$('button')) {
    const txt = await t.textContent();
    if (txt?.trim().toLowerCase() === 'admin') { await t.click(); console.log('Clicked Admin tab'); break; }
  }
  await sleep(500);

  await page.fill('input[type="email"]', 'karya.ai.admin@gmail.com');
  await page.fill('input[type="password"]', 'AdminPassword123!');

  page.once('dialog', d => { console.log('Dialog:', d.message()); d.accept(); });
  await page.click('button[type="submit"]');
  await sleep(3000);

  const goBtn = await page.$('button:has-text("Go to Dashboard"), a:has-text("Go to Dashboard"), button:has-text("dashboard")');
  if (goBtn) { await goBtn.click(); await sleep(2000); }
  console.log('URL:', page.url());

  // Take screenshot to see current state
  await page.screenshot({ path: 'd:/karya/scripts/admin-dashboard.png' });
  console.log('Screenshot: admin-dashboard.png');

  // Find and click the candidate with 253c6303 in the list
  const bodyText = await page.textContent('body');
  console.log('Has 253c6303:', bodyText?.includes('253c6303'));
  console.log('Has 31604:', bodyText?.includes('31604'));

  // Click the candidate row
  let found = false;
  for (const el of await page.$$('*')) {
    try {
      const txt = await el.textContent();
      if ((txt?.includes('253c6303') || txt?.includes('31604')) && txt?.length < 100) {
        await el.click();
        console.log('Clicked candidate row:', txt?.trim().slice(0,60));
        found = true;
        break;
      }
    } catch {}
  }
  if (!found) console.log('WARNING: Could not find candidate row');
  await sleep(1500);

  await page.screenshot({ path: 'd:/karya/scripts/admin-selected.png' });
  console.log('Screenshot: admin-selected.png');

  // Find trash button by title
  let deleted = false;
  for (const btn of await page.$$('button')) {
    const title = await btn.getAttribute('title');
    const txt = await btn.textContent();
    if (title?.toLowerCase().includes('remove') || title?.toLowerCase().includes('delete') || title?.toLowerCase().includes('permanent')) {
      console.log('Found delete button, title:', title);
      page.once('dialog', async d => { console.log('Confirm dialog:', d.message()); await d.accept(); });
      await btn.click();
      deleted = true;
      await sleep(2000);
      break;
    }
  }

  if (!deleted) {
    // Try SVG trash icon buttons
    const allBtns = await page.$$('button');
    console.log('Total buttons:', allBtns.length);
    for (const btn of allBtns) {
      const html = await btn.innerHTML();
      if (html.includes('Trash') || html.includes('trash')) {
        console.log('Found trash SVG button');
        page.once('dialog', async d => { console.log('Confirm dialog:', d.message()); await d.accept(); });
        await btn.click();
        deleted = true;
        await sleep(2000);
        break;
      }
    }
  }

  await page.screenshot({ path: 'd:/karya/scripts/admin-after-delete.png' });
  const afterBody = await page.textContent('body');
  console.log('After delete - Has 253c6303:', afterBody?.includes('253c6303'));
  console.log('After delete - Has 31604:', afterBody?.includes('31604'));
  await page.close();
}

// ===== PART 2: Counselor deletes cad72432 candidate =====
{
  const page = await browser.newPage();
  console.log('\n=== COUNSELOR: Login ===');
  await page.goto('http://localhost:5173/auth');
  await sleep(2000);

  // Click Employee tab
  for (const t of await page.$$('button')) {
    const txt = await t.textContent();
    if (txt?.trim().toLowerCase() === 'employee' || txt?.trim().toLowerCase() === 'counselor') {
      await t.click(); console.log('Clicked Employee tab'); break;
    }
  }
  await sleep(500);

  await page.fill('input[type="email"]', 'mkarthikeya24@gmail.com');
  await page.fill('input[type="password"]', 'Consultancy@2026');
  await page.click('button[type="submit"]');
  await sleep(3000);

  const goBtn = await page.$('button:has-text("Go to Dashboard"), a:has-text("Go to Dashboard")');
  if (goBtn) { await goBtn.click(); await sleep(2000); }
  console.log('URL:', page.url());

  await page.screenshot({ path: 'd:/karya/scripts/counselor-dashboard.png' });
  const bodyText = await page.textContent('body');
  console.log('Has cad72432:', bodyText?.includes('cad72432'));
  console.log('Has 32282:', bodyText?.includes('32282'));

  // Click candidate row
  let found = false;
  for (const el of await page.$$('*')) {
    try {
      const txt = await el.textContent();
      if ((txt?.includes('cad72432') || txt?.includes('32282')) && txt?.length < 100) {
        await el.click();
        console.log('Clicked candidate row:', txt?.trim().slice(0,60));
        found = true;
        break;
      }
    } catch {}
  }
  if (!found) console.log('WARNING: Could not find candidate row');
  await sleep(1500);

  await page.screenshot({ path: 'd:/karya/scripts/counselor-selected.png' });

  // Find and click delete button
  let deleted = false;
  for (const btn of await page.$$('button')) {
    const title = await btn.getAttribute('title');
    if (title?.toLowerCase().includes('remove') || title?.toLowerCase().includes('delete') || title?.toLowerCase().includes('permanent')) {
      console.log('Found delete button, title:', title);
      page.once('dialog', async d => { console.log('Confirm dialog:', d.message()); await d.accept(); });
      await btn.click();
      deleted = true;
      await sleep(2000);
      break;
    }
  }

  if (!deleted) {
    const allBtns = await page.$$('button');
    for (const btn of allBtns) {
      const html = await btn.innerHTML();
      if (html.includes('Trash') || html.includes('trash')) {
        console.log('Found trash SVG button');
        page.once('dialog', async d => { console.log('Confirm dialog:', d.message()); await d.accept(); });
        await btn.click();
        deleted = true;
        await sleep(2000);
        break;
      }
    }
  }

  await page.screenshot({ path: 'd:/karya/scripts/counselor-after-delete.png' });
  const afterBody = await page.textContent('body');
  console.log('After delete - Has cad72432:', afterBody?.includes('cad72432'));
  console.log('After delete - Has 32282:', afterBody?.includes('32282'));
  await page.close();
}

await browser.close();
console.log('\nDone. Check screenshots in d:/karya/scripts/');
