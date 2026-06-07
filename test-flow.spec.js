import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Array to hold all diagnostic errors
const errorLog = [];

test.describe('Karya Diagnostic E2E Crawler', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Global Error Listeners
    page.on('pageerror', exception => {
      errorLog.push({ type: 'pageerror', message: exception.message, stack: exception.stack });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLog.push({ type: 'console', text: msg.text() });
      }
    });

    page.on('response', response => {
      const status = response.status();
      // Capture 400 and 500 level errors (excluding 404s to avoid noise, unless desired)
      if (status >= 400 && status !== 404) {
        errorLog.push({ type: 'network', url: response.url(), status: status });
      }
    });
  });

  test.afterAll(async () => {
    // 6. Error Compilation
    const logPath = path.join(process.cwd(), 'karya_error_log.json');
    fs.writeFileSync(logPath, JSON.stringify(errorLog, null, 2));
    console.log(`✅ Diagnostic run complete. Error log saved to ${logPath}`);
  });

  test('Execute User Flow: Registration, Onboarding Intake, and Admin Approval', async ({ page }) => {
    // Note: The UI flow for "Client Registration" happens on the Auth page, 
    // and "Data Intake" happens during the Client Onboarding flow.

    // --- STEP 1: Client Registration ---
    await page.goto('http://localhost:5173/auth');
    
    // Switch to Candidate Tab
    await page.getByRole('button', { name: /Candidate/i }).click();
    
    // Click 'New here? Create account' to show sign up fields
    await page.getByRole('button', { name: /New here\?/i }).click();

    // Fill Registration Details
    await page.getByPlaceholder('John Doe').fill('Varun Sai Jadala');
    await page.getByPlaceholder('name@example.com').fill('varunvasudev009@gmail.com');
    await page.getByPlaceholder('Enter password').fill('TestPassword123!');
    
    // Submit Registration
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for the app to navigate to the Onboarding section
    await page.waitForURL('**/onboarding', { timeout: 10000 });

    // --- STEP 2: Data Intake / Dossier Completion (Onboarding) ---
    // Onboarding Step 1 (Identity)
    await page.getByPlaceholder('ALEX').fill('Varun Sai');
    await page.getByPlaceholder('CHEN').fill('Jadala');
    await page.getByPlaceholder('YYYY-MM-DD').fill('2000-01-01'); // DOB Not Provided
    await page.getByPlaceholder('+1 (555) 000-0000').fill('+91 8298299619');
    // Email is usually pre-filled but we ensure it matches
    await page.getByPlaceholder('alex.chen@example.com').fill('varunvasudev009@gmail.com');
    await page.getByRole('button', { name: /Next Segment/i }).click();

    // Onboarding Step 2 (Location)
    await page.getByPlaceholder('123 Street, City, State, Country, Zip').fill('Hyderabad');
    await page.getByPlaceholder('E.G. NEW YORK, REMOTE, BANGALORE').fill('Hyderabad');
    await page.getByRole('button', { name: /Next Segment/i }).click();

    // Onboarding Step 3 (Academic & Domain)
    await page.getByPlaceholder('E.G. B.TECH, MS').fill('B.Tech - CSE');
    await page.getByPlaceholder('E.G. STANFORD').fill('Unknown'); // Not provided
    await page.getByPlaceholder('E.G. 2024').fill('2024');
    await page.getByPlaceholder('E.G. FULL STACK, DATA SCIENCE').fill('AI / Cloud');
    await page.getByRole('button', { name: /Next Segment/i }).click();

    // Onboarding Step 4 (Professional Context)
    await page.getByPlaceholder('E.G. 5 YEARS').fill('1.5 Years');
    await page.getByPlaceholder('E.G. GOOGLE').fill('Wipro');
    await page.getByPlaceholder('E.G. 15 LPA').fill('3.5L');
    await page.getByPlaceholder('E.G. 25 LPA').fill('5.5L');
    await page.getByRole('button', { name: /Initialize Profile/i }).click();

    // Wait for redirect to client dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // --- STEP 3: Admin Login & Approval ---
    // Force logout by going back to auth or clearing storage
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:5173/auth');

    // Switch to Admin Tab
    await page.getByRole('button', { name: /Admin/i }).click();
    
    // Login as Admin
    await page.getByPlaceholder('name@example.com').fill('karya.ai.admin@gmail.com');
    await page.getByPlaceholder('Enter password').fill('AdminPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Navigate to Admin Dashboard
    await page.getByRole('button', { name: 'Go to Dashboard' }).click();
    await page.waitForURL('**/admin', { timeout: 10000 });

    // Switch to Pending Approvals Tab
    await page.getByRole('button', { name: /Pending Approvals/i }).click();

    // Locate Candidate and Select
    await page.getByPlaceholder('Search name / email...').fill('Varun');
    // Click the first matching candidate button in the list
    await page.locator('button', { hasText: 'Varun Sai' }).first().click();

    // Click Approve
    await page.getByRole('button', { name: /Approve Candidate/i }).click();

    // Allow some time to catch any final DOM or network errors
    await page.waitForTimeout(3000);
  });
});
