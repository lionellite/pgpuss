import { test, expect } from '@playwright/test';

test('capture more screenshots', async ({ page }) => {
  // Landing Page
  await page.goto('http://localhost:5173/');
  await page.screenshot({ path: 'landing_page_final.png', fullPage: true });

  // Login Page
  await page.goto('http://localhost:5173/connexion');
  await page.screenshot({ path: 'login_page_final.png', fullPage: true });

  // Depot Page
  await page.goto('http://localhost:5173/deposer');
  await page.screenshot({ path: 'depot_page_step0.png', fullPage: true });

  // Dashboard (Attempt with mock or bypass if possible, otherwise we might just have the public ones)
  // Since we have seed data, let's try to login as admin
  await page.goto('http://localhost:5173/connexion');
  await page.fill('input[type="email"]', 'admin@pgpuss.bj');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard');
  await page.screenshot({ path: 'dashboard_home_final.png', fullPage: true });

  await page.goto('http://localhost:5173/dashboard/plaintes');
  await page.screenshot({ path: 'dashboard_list_final.png', fullPage: true });
});
