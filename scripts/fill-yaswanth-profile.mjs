import { chromium } from 'playwright';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false, slowMo: 400 });
const page = await browser.newPage();

page.on('console', m => { if (m.type() === 'error') console.log('[ERR]', m.text()); });

// Login as Yaswanth
console.log('=== Login as Yaswanth ===');
await page.goto('http://localhost:5173/auth');
await sleep(2000);

// Sign out any existing session
const body0 = await page.textContent('body');
if (body0?.toUpperCase().includes('LOGGED IN')) {
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.toUpperCase().includes('SIGN OUT')) { await btn.click(); await sleep(1500); break; }
  }
}

// Candidate tab
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.trim().toLowerCase() === 'candidate') { await btn.click(); break; }
}
await sleep(500);

await page.fill('input[type="email"]', 'yaswanthalapati17@gmail.com');
await page.fill('input[type="password"]', 'yaswanthalapati17');
await page.click('button[type="submit"]');
await sleep(3000);

// Go to dashboard
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.toUpperCase().includes('DASHBOARD')) { await btn.click(); await sleep(2000); break; }
}
console.log('URL:', page.url());
await page.screenshot({ path: 'd:/karya/scripts/p1-candidate-dashboard.png' });

// Click My Profile
for (const btn of await page.$$('button, a, li')) {
  const txt = (await btn.textContent())?.toLowerCase();
  if (txt?.includes('my profile') || txt?.includes('profile')) { await btn.click(); await sleep(1500); break; }
}
await page.screenshot({ path: 'd:/karya/scripts/p2-profile-tab.png' });

// Helper to fill a named input
async function fillField(name, value) {
  try {
    await page.fill(`input[name="${name}"], textarea[name="${name}"]`, value);
    console.log(`Filled ${name}: ${value}`);
  } catch {
    console.log(`WARN: could not fill ${name}`);
  }
}

// Fill all fields
await fillField('phone', '9381556710');
await fillField('dob', '2001-02-17');
await fillField('permanentAddress', 'Rajamundry');
await fillField('preferredLocation', 'Hyderabad');
await fillField('domain', 'Service Now');
await fillField('experience', '3.3');
await fillField('currentCompany', 'Tata Consultancy Services (TCS)');
await fillField('currentCTC', '5.8L');
await fillField('expectedCTC', '12L');
await fillField('skills', 'Java, Oracle, ServiceNow');
await fillField('degree', 'ECE B.Tech');
await fillField('college', 'Vishnu Institute of Technology');
await fillField('year', '2022');

// Add target role
const roleInput = await page.$('input[placeholder*="Senior" i], input[placeholder*="role" i], input[placeholder*="Backend" i]');
if (roleInput) {
  await roleInput.fill('Service Now');
  // Click the + button
  const plusBtns = await page.$$('button');
  for (const btn of plusBtns) {
    const html = await btn.innerHTML();
    if (html.includes('Plus') || html.includes('+') || (await btn.textContent())?.includes('+')) {
      await btn.click(); console.log('Added target role'); break;
    }
  }
}

await page.screenshot({ path: 'd:/karya/scripts/p3-filled.png' });

// Submit
await page.click('button[type="submit"], button:has-text("Save Profile Changes")');
await sleep(3000);

await page.screenshot({ path: 'd:/karya/scripts/p4-after-save.png' });
const bodyAfter = await page.textContent('body');
console.log('Has success toast:', bodyAfter?.includes('Profile saved') || bodyAfter?.includes('successfully'));
console.log('Has error toast:', bodyAfter?.includes('Failed'));

await browser.close();
console.log('\nDone. Check p1-p4 screenshots.');
