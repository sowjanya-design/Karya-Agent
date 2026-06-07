import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 300 });

for (const email of ['mkarthikeya24@gmail.com', 'kbsn1170@gmail.com']) {
  console.log('\n=== Testing:', email, '===');
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/auth');
  await sleep(1500);

  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.trim().toUpperCase() === 'CONSULTANT') { await btn.click(); break; }
  }
  await sleep(300);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'Consultancy@2026');
  await page.click('button[type="submit"]');
  await sleep(3000);

  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
  }

  // Check sidebar tabs
  const allBtns = await page.$$('button');
  const tabLabels = [];
  for (const btn of allBtns) {
    const t = (await btn.textContent())?.trim();
    if (['Overview','Candidate Roster','Application Pipeline','Pending Approvals'].some(x => t?.includes(x))) tabLabels.push(t);
  }
  console.log('Sidebar tabs:', tabLabels);

  // Click Application Pipeline
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toLowerCase().includes('pipeline')) { await btn.click(); await sleep(2000); break; }
  }

  // Check for candidates in dropdown
  const select = await page.$('select');
  if (select) {
    const options = await select.$$('option');
    console.log('Candidates in pipeline dropdown:');
    for (const opt of options) {
      console.log(' -', await opt.textContent(), '| uid:', await opt.getAttribute('value'));
    }
    if (options.length > 0) {
      await select.selectOption({ index: 0 });
      await sleep(2000);
    }
  } else {
    console.log('No candidates assigned / select not found');
  }

  const fname = email.split('@')[0];
  await page.screenshot({ path: `d:/karya/scripts/counselor-${fname}-pipeline.png` });
  const body = await page.textContent('body');
  console.log('Has "NO CANDIDATES FOUND":', body?.includes('NO CANDIDATES'));
  console.log('Has "Application Pipeline":', body?.includes('Application Pipeline'));

  await page.close();
}

await browser.close();
console.log('\nDone.');
