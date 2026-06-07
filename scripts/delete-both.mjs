import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 700 });
const page = await browser.newPage();

console.log('=== Admin: delete both remaining CK candidates ===');
await page.goto('http://localhost:5173/auth');
await sleep(2000);

// Already logged in check
const bodyTxt = await page.textContent('body');
if (bodyTxt?.toUpperCase().includes('LOGGED IN')) {
  for (const btn of await page.$$('button')) {
    const txt = (await btn.textContent())?.toUpperCase();
    if (txt?.includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
} else {
  for (const t of await page.$$('button')) {
    if ((await t.textContent())?.trim().toLowerCase() === 'admin') { await t.click(); break; }
  }
  await sleep(400);
  await page.fill('input[type="email"]', 'karya.ai.admin@gmail.com');
  await page.fill('input[type="password"]', 'AdminPassword123!');
  await page.click('button[type="submit"]');
  await sleep(3000);
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }
}

console.log('URL:', page.url());

// Click Candidate Roster
for (const btn of await page.$$('button, a, li')) {
  if ((await btn.textContent())?.toLowerCase().includes('roster')) { await btn.click(); await sleep(1000); break; }
}

// Delete all CK (no-email) candidates — click rows that contain 253c6303 or cad72432
for (let pass = 0; pass < 2; pass++) {
  await page.screenshot({ path: `d:/karya/scripts/del-pass${pass+1}-before.png` });

  // Find all candidate rows in the left panel
  const allElems = await page.$$('*');
  let targetClicked = false;
  for (const el of allElems) {
    try {
      const txt = await el.textContent();
      const tag = await el.evaluate(e => e.tagName.toLowerCase());
      if ((txt?.includes('253c6303') || txt?.includes('cad72432')) && txt.length < 120 && ['div','li','button','span','p'].includes(tag)) {
        const box = await el.boundingBox();
        if (box && box.width > 100 && box.height > 20) {
          await el.click();
          console.log(`Pass ${pass+1}: Clicked candidate row:`, txt.trim().slice(0,60));
          targetClicked = true;
          await sleep(1500);
          break;
        }
      }
    } catch {}
  }

  if (!targetClicked) {
    console.log(`Pass ${pass+1}: no target found, clicking first available row`);
    for (const btn of await page.$$('button')) {
      const html = await btn.innerHTML();
      const box = await btn.boundingBox();
      if (html.includes('svg') && box && box.x > 900 && box.width < 60) {
        await btn.click(); await sleep(1500); break;
      }
    }
  }

  await page.screenshot({ path: `d:/karya/scripts/del-pass${pass+1}-selected.png` });

  // Click delete (trash) button
  let deleted = false;
  for (const btn of await page.$$('button')) {
    const title = (await btn.getAttribute('title')) || '';
    const html = await btn.innerHTML();
    if (title.match(/remove|delete|permanent/i) || html.includes('Trash')) {
      console.log(`Pass ${pass+1}: Found delete btn`);
      page.once('dialog', async d => { console.log('Confirm:', d.message()); await d.accept(); });
      await btn.click();
      deleted = true;
      await sleep(2500);
      break;
    }
  }
  console.log(`Pass ${pass+1}: deleted =`, deleted);
}

await page.screenshot({ path: 'd:/karya/scripts/del-final.png' });
const finalBody = await page.textContent('body');
console.log('253c6303 still there:', finalBody?.includes('253c6303'));
console.log('cad72432 still there:', finalBody?.includes('cad72432'));

await browser.close();
console.log('\nDone. Check screenshots del-pass1/2-before/selected + del-final.png');
