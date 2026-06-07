# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-flow.spec.js >> Karya Diagnostic E2E Crawler >> Execute User Flow: Registration, Onboarding Intake, and Admin Approval
- Location: test-flow.spec.js:38:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/onboarding" until "load"
============================================================
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import fs from 'fs';
  3   | import path from 'path';
  4   | 
  5   | // Array to hold all diagnostic errors
  6   | const errorLog = [];
  7   | 
  8   | test.describe('Karya Diagnostic E2E Crawler', () => {
  9   |   
  10  |   test.beforeEach(async ({ page }) => {
  11  |     // 1. Global Error Listeners
  12  |     page.on('pageerror', exception => {
  13  |       errorLog.push({ type: 'pageerror', message: exception.message, stack: exception.stack });
  14  |     });
  15  | 
  16  |     page.on('console', msg => {
  17  |       if (msg.type() === 'error') {
  18  |         errorLog.push({ type: 'console', text: msg.text() });
  19  |       }
  20  |     });
  21  | 
  22  |     page.on('response', response => {
  23  |       const status = response.status();
  24  |       // Capture 400 and 500 level errors (excluding 404s to avoid noise, unless desired)
  25  |       if (status >= 400 && status !== 404) {
  26  |         errorLog.push({ type: 'network', url: response.url(), status: status });
  27  |       }
  28  |     });
  29  |   });
  30  | 
  31  |   test.afterAll(async () => {
  32  |     // 6. Error Compilation
  33  |     const logPath = path.join(process.cwd(), 'karya_error_log.json');
  34  |     fs.writeFileSync(logPath, JSON.stringify(errorLog, null, 2));
  35  |     console.log(`✅ Diagnostic run complete. Error log saved to ${logPath}`);
  36  |   });
  37  | 
  38  |   test('Execute User Flow: Registration, Onboarding Intake, and Admin Approval', async ({ page }) => {
  39  |     // Note: The UI flow for "Client Registration" happens on the Auth page, 
  40  |     // and "Data Intake" happens during the Client Onboarding flow.
  41  | 
  42  |     // --- STEP 1: Client Registration ---
  43  |     await page.goto('http://localhost:5173/auth');
  44  |     
  45  |     // Switch to Candidate Tab
  46  |     await page.getByRole('button', { name: /Candidate/i }).click();
  47  |     
  48  |     // Click 'New here? Create account' to show sign up fields
  49  |     await page.getByRole('button', { name: /New here\?/i }).click();
  50  | 
  51  |     // Fill Registration Details
  52  |     await page.getByPlaceholder('John Doe').fill('Varun Sai Jadala');
  53  |     await page.getByPlaceholder('name@example.com').fill('varunvasudev009@gmail.com');
  54  |     await page.getByPlaceholder('Enter password').fill('TestPassword123!');
  55  |     
  56  |     // Submit Registration
  57  |     await page.getByRole('button', { name: 'Create Account' }).click();
  58  | 
  59  |     // Wait for the app to navigate to the Onboarding section
> 60  |     await page.waitForURL('**/onboarding', { timeout: 10000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  61  | 
  62  |     // --- STEP 2: Data Intake / Dossier Completion (Onboarding) ---
  63  |     // Onboarding Step 1 (Identity)
  64  |     await page.getByPlaceholder('ALEX').fill('Varun Sai');
  65  |     await page.getByPlaceholder('CHEN').fill('Jadala');
  66  |     await page.getByPlaceholder('YYYY-MM-DD').fill('2000-01-01'); // DOB Not Provided
  67  |     await page.getByPlaceholder('+1 (555) 000-0000').fill('+91 8298299619');
  68  |     // Email is usually pre-filled but we ensure it matches
  69  |     await page.getByPlaceholder('alex.chen@example.com').fill('varunvasudev009@gmail.com');
  70  |     await page.getByRole('button', { name: /Next Segment/i }).click();
  71  | 
  72  |     // Onboarding Step 2 (Location)
  73  |     await page.getByPlaceholder('123 Street, City, State, Country, Zip').fill('Hyderabad');
  74  |     await page.getByPlaceholder('E.G. NEW YORK, REMOTE, BANGALORE').fill('Hyderabad');
  75  |     await page.getByRole('button', { name: /Next Segment/i }).click();
  76  | 
  77  |     // Onboarding Step 3 (Academic & Domain)
  78  |     await page.getByPlaceholder('E.G. B.TECH, MS').fill('B.Tech - CSE');
  79  |     await page.getByPlaceholder('E.G. STANFORD').fill('Unknown'); // Not provided
  80  |     await page.getByPlaceholder('E.G. 2024').fill('2024');
  81  |     await page.getByPlaceholder('E.G. FULL STACK, DATA SCIENCE').fill('AI / Cloud');
  82  |     await page.getByRole('button', { name: /Next Segment/i }).click();
  83  | 
  84  |     // Onboarding Step 4 (Professional Context)
  85  |     await page.getByPlaceholder('E.G. 5 YEARS').fill('1.5 Years');
  86  |     await page.getByPlaceholder('E.G. GOOGLE').fill('Wipro');
  87  |     await page.getByPlaceholder('E.G. 15 LPA').fill('3.5L');
  88  |     await page.getByPlaceholder('E.G. 25 LPA').fill('5.5L');
  89  |     await page.getByRole('button', { name: /Initialize Profile/i }).click();
  90  | 
  91  |     // Wait for redirect to client dashboard
  92  |     await page.waitForURL('**/dashboard', { timeout: 10000 });
  93  | 
  94  |     // --- STEP 3: Admin Login & Approval ---
  95  |     // Force logout by going back to auth or clearing storage
  96  |     await page.evaluate(() => localStorage.clear());
  97  |     await page.goto('http://localhost:5173/auth');
  98  | 
  99  |     // Switch to Admin Tab
  100 |     await page.getByRole('button', { name: /Admin/i }).click();
  101 |     
  102 |     // Login as Admin
  103 |     await page.getByPlaceholder('name@example.com').fill('karya.ai.admin@gmail.com');
  104 |     await page.getByPlaceholder('Enter password').fill('AdminPassword123!');
  105 |     await page.getByRole('button', { name: 'Sign In' }).click();
  106 | 
  107 |     // Navigate to Admin Dashboard
  108 |     await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  109 |     await page.waitForURL('**/admin', { timeout: 10000 });
  110 | 
  111 |     // Switch to Pending Approvals Tab
  112 |     await page.getByRole('button', { name: /Pending Approvals/i }).click();
  113 | 
  114 |     // Locate Candidate and Select
  115 |     await page.getByPlaceholder('Search name / email...').fill('Varun');
  116 |     // Click the first matching candidate button in the list
  117 |     await page.locator('button', { hasText: 'Varun Sai' }).first().click();
  118 | 
  119 |     // Click Approve
  120 |     await page.getByRole('button', { name: /Approve Candidate/i }).click();
  121 | 
  122 |     // Allow some time to catch any final DOM or network errors
  123 |     await page.waitForTimeout(3000);
  124 |   });
  125 | });
  126 | 
```