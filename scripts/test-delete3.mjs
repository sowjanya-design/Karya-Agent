import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 700 });

// ===== PART 1: Admin deletes first NO EMAIL candidate =====
{
  const page = await browser.newPage();
  console.log('\n=== ADMIN: Login ===');
  await page.goto('http://localhost:5173/auth');
  await sleep(2000);
  for (const t of await page.$$('button')) {
    if ((await t.textContent())?.trim().toLowerCase() === 'admin') { await t.click(); break; }
  }
  await sleep(400);
  await page.fill('input[type="email"]', 'karya.ai.admin@gmail.com');
  await page.fill('input[type="password"]', 'AdminPassword123!');
  await page.click('button[type="submit"]');
  await sleep(3000);
  console.log('URL:', page.url());

  // Click Candidate Roster tab
  for (const t of await page.$$('button, a, [role="button"]')) {
    const txt = (await t.textContent())?.trim().toLowerCase();
    if (txt?.includes('roster') || txt?.includes('candidate roster')) {
      await t.click(); console.log('Clicked Candidate Roster'); break;
    }
  }
  await sleep(1000);
  await page.screenshot({ path: 'd:/karya/scripts/s1-roster.png' });

  // Click the first "NO EMAIL" row's arrow
  const arrows = await page.$$('button svg, button[title], [data-candidate], tr, li');
  const rowBtns = await page.$$('button');
  console.log('Buttons on page:', rowBtns.length);

  // Look for arrow/chevron buttons
  let dossierOpened = false;
  for (const btn of rowBtns) {
    const html = await btn.innerHTML();
    const title = await btn.getAttribute('title') || '';
    if (html.includes('ChevronRight') || html.includes('chevron') || html.includes('ArrowRight') || title.includes('View')) {
      await btn.click();
      console.log('Clicked row arrow/button');
      dossierOpened = true;
      await sleep(1500);
      await page.screenshot({ path: 'd:/karya/scripts/s2-dossier.png' });
      break;
    }
  }

  if (!dossierOpened) {
    // Try clicking the > SVG path directly
    const svgEls = await page.$$('svg');
    for (const svg of svgEls) {
      const box = await svg.boundingBox();
      if (box && box.width < 20 && box.height < 20) {
        await svg.click().catch(() => {});
        await sleep(800);
        const newBtns = await page.$$('button');
        if (newBtns.length > rowBtns.length) { dossierOpened = true; break; }
      }
    }
    await page.screenshot({ path: 'd:/karya/scripts/s2-dossier.png' });
  }

  // Now find the trash/delete button
  let deleted = false;
  for (const btn of await page.$$('button')) {
    const title = (await btn.getAttribute('title')) || '';
    const html = await btn.innerHTML();
    if (title.toLowerCase().includes('remove') || title.toLowerCase().includes('delete') || title.toLowerCase().includes('permanent') || html.includes('Trash2') || html.includes('trash')) {
      console.log('Found delete button, title:', title);
      page.once('dialog', async d => { console.log('Dialog:', d.message()); await d.accept(); });
      await btn.click();
      deleted = true;
      await sleep(2000);
      break;
    }
  }
  console.log('Delete attempted:', deleted);
  await page.screenshot({ path: 'd:/karya/scripts/s3-after-admin-delete.png' });
  await page.close();
}

// ===== PART 2: Counselor login =====
{
  const page = await browser.newPage();
  console.log('\n=== COUNSELOR: Login ===');
  await page.goto('http://localhost:5173/auth');
  await sleep(2000);
  for (const t of await page.$$('button')) {
    const txt = (await t.textContent())?.trim().toLowerCase();
    if (txt === 'employee' || txt === 'counselor') { await t.click(); break; }
  }
  await sleep(400);
  await page.fill('input[type="email"]', 'mkarthikeya24@gmail.com');
  await page.fill('input[type="password"]', 'Consultancy@2026');
  await page.click('button[type="submit"]');
  await sleep(3000);

  const goBtn = await page.$('button:has-text("Go to Dashboard")');
  if (goBtn) { await goBtn.click(); await sleep(2000); }
  console.log('URL:', page.url());
  await page.screenshot({ path: 'd:/karya/scripts/s4-counselor.png' });

  const bodyText = await page.textContent('body');
  console.log('Page has candidates:', bodyText?.length);

  // Try clicking first candidate in the list
  const allBtns = await page.$$('button');
  console.log('Counselor buttons count:', allBtns.length);
  for (const btn of allBtns) {
    const txt = (await btn.textContent())?.trim();
    const html = await btn.innerHTML();
    if ((txt && txt.length > 2 && txt.length < 60 && !txt.includes('Login') && !txt.includes('Sign')) || html.includes('ChevronRight')) {
      console.log('Candidate button text:', txt?.slice(0,50));
    }
  }

  // Find a candidate list item - look for clickable rows
  const listItems = await page.$$('[class*="cursor-pointer"], [class*="hover:bg"]');
  console.log('Clickable items:', listItems.length);
  if (listItems.length > 0) {
    await listItems[0].click();
    console.log('Clicked first candidate item');
    await sleep(1500);
  }

  await page.screenshot({ path: 'd:/karya/scripts/s5-counselor-selected.png' });

  // Delete
  let deleted = false;
  for (const btn of await page.$$('button')) {
    const title = (await btn.getAttribute('title')) || '';
    const html = await btn.innerHTML();
    if (title.toLowerCase().includes('remove') || title.toLowerCase().includes('delete') || title.toLowerCase().includes('permanent') || html.includes('Trash2') || html.includes('trash')) {
      console.log('Found delete btn, title:', title);
      page.once('dialog', async d => { console.log('Dialog:', d.message()); await d.accept(); });
      await btn.click();
      deleted = true;
      await sleep(2000);
      break;
    }
  }
  console.log('Delete attempted:', deleted);
  await page.screenshot({ path: 'd:/karya/scripts/s6-counselor-after.png' });
  await page.close();
}

await browser.close();
console.log('Done. Check screenshots s1–s6.');
