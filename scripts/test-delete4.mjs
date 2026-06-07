import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 600 });

async function clickDashboardBtn(page) {
  for (const btn of await page.$$('button, a')) {
    const txt = (await btn.textContent())?.toUpperCase().trim();
    if (txt?.includes('DASHBOARD') || txt?.includes('GO TO')) {
      await btn.click();
      await sleep(2000);
      return true;
    }
  }
  return false;
}

// ===== ADMIN: delete one NO EMAIL candidate =====
{
  const page = await browser.newPage();
  console.log('\n=== ADMIN ===');
  await page.goto('http://localhost:5173/auth');
  await sleep(2000);

  // Already logged in?
  let bodyTxt = await page.textContent('body');
  if (bodyTxt?.includes('YOU ARE LOGGED IN') || bodyTxt?.includes('LOGGED IN')) {
    console.log('Already logged in, clicking GO TO DASHBOARD');
    await clickDashboardBtn(page);
  } else {
    for (const t of await page.$$('button')) {
      if ((await t.textContent())?.trim().toLowerCase() === 'admin') { await t.click(); break; }
    }
    await sleep(400);
    await page.fill('input[type="email"]', 'karya.ai.admin@gmail.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await sleep(3000);
    await clickDashboardBtn(page);
  }

  console.log('URL:', page.url());
  await page.screenshot({ path: 'd:/karya/scripts/d1.png' });

  // Go to Candidate Roster tab
  for (const btn of await page.$$('button, a, li')) {
    const txt = (await btn.textContent())?.toLowerCase().trim();
    if (txt?.includes('roster')) { await btn.click(); console.log('Clicked Roster tab'); break; }
  }
  await sleep(1000);
  await page.screenshot({ path: 'd:/karya/scripts/d2-roster.png' });

  // Click the ">" arrow on a candidate row (look for chevron buttons on right side)
  const allBtns = await page.$$('button');
  let opened = false;
  for (const btn of allBtns) {
    const box = await btn.boundingBox();
    if (!box) continue;
    const html = await btn.innerHTML();
    // Chevrons are usually narrow buttons on the right of the row
    if ((html.includes('svg') || html.includes('SVG')) && box.width < 60 && box.height < 60 && box.x > 900) {
      await btn.click();
      console.log('Clicked row arrow at x:', box.x);
      opened = true;
      await sleep(1500);
      break;
    }
  }
  if (!opened) {
    // Click anywhere in the first row area
    const rows = await page.$$('tr, [class*="row"], [class*="candidate"]');
    if (rows.length > 1) { await rows[1].click(); opened = true; await sleep(1000); }
  }
  await page.screenshot({ path: 'd:/karya/scripts/d3-dossier.png' });

  // Find trash button
  let deleted = false;
  for (const btn of await page.$$('button')) {
    const title = (await btn.getAttribute('title')) || '';
    const html = await btn.innerHTML();
    if (title.match(/remove|delete|permanent/i) || html.includes('Trash')) {
      console.log('Found delete btn, title:', title);
      page.once('dialog', async d => { console.log('Confirm:', d.message()); await d.accept(); });
      await btn.click();
      deleted = true;
      await sleep(2000);
      break;
    }
  }
  console.log('Admin delete attempted:', deleted);
  await page.screenshot({ path: 'd:/karya/scripts/d4-after.png' });
  await page.close();
}

// ===== COUNSELOR: delete remaining candidate =====
{
  const page = await browser.newPage();
  console.log('\n=== COUNSELOR ===');
  await page.goto('http://localhost:5173/auth');
  await sleep(2000);

  let bodyTxt = await page.textContent('body');
  if (bodyTxt?.toUpperCase().includes('LOGGED IN')) {
    // Sign out first to switch account
    for (const btn of await page.$$('button')) {
      const txt = (await btn.textContent())?.toUpperCase();
      if (txt?.includes('SIGN OUT') || txt?.includes('LOGOUT')) { await btn.click(); await sleep(1500); break; }
    }
  }

  for (const t of await page.$$('button')) {
    const txt = (await t.textContent())?.trim().toLowerCase();
    if (txt === 'employee' || txt === 'counselor') { await t.click(); break; }
  }
  await sleep(400);
  await page.fill('input[type="email"]', 'mkarthikeya24@gmail.com');
  await page.fill('input[type="password"]', 'Consultancy@2026');
  await page.click('button[type="submit"]');
  await sleep(3000);
  await clickDashboardBtn(page);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'd:/karya/scripts/d5-counselor.png' });

  // Click first candidate in sidebar list
  const sideItems = await page.$$('[class*="cursor"], [class*="hover"]');
  console.log('Side items found:', sideItems.length);
  if (sideItems.length > 0) {
    await sideItems[0].click();
    console.log('Clicked first candidate');
    await sleep(1500);
  } else {
    // Try all clickable divs
    for (const el of await page.$$('div, li')) {
      const box = await el.boundingBox();
      if (box && box.width > 150 && box.width < 300 && box.height > 30 && box.height < 80) {
        const txt = await el.textContent();
        if (txt && txt.trim().length > 3) {
          console.log('Clicking panel item:', txt.trim().slice(0,40));
          await el.click();
          await sleep(1000);
          break;
        }
      }
    }
  }
  await page.screenshot({ path: 'd:/karya/scripts/d6-counselor-selected.png' });

  let deleted = false;
  for (const btn of await page.$$('button')) {
    const title = (await btn.getAttribute('title')) || '';
    const html = await btn.innerHTML();
    if (title.match(/remove|delete|permanent/i) || html.includes('Trash')) {
      console.log('Found delete btn, title:', title);
      page.once('dialog', async d => { console.log('Confirm:', d.message()); await d.accept(); });
      await btn.click();
      deleted = true;
      await sleep(2000);
      break;
    }
  }
  console.log('Counselor delete attempted:', deleted);
  await page.screenshot({ path: 'd:/karya/scripts/d7-counselor-after.png' });
  await page.close();
}

await browser.close();
console.log('\nDone. Check d1-d7 screenshots.');
