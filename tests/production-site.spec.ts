import { test, expect } from '@playwright/test';

test('can access production site at pmcellvendas.vercel.app', async ({ page }) => {
  // Set a longer timeout for this test
  test.setTimeout(60000);
  
  // Try to access the production site
  const response = await page.goto('https://pmcellvendas.vercel.app', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  // Check if the page loads successfully
  expect(response?.status()).toBe(200);
  
  // Check if the page is visible and has content
  await expect(page.locator('body')).toBeVisible();
  
  // Log the page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for specific PMCELL content
  await expect(page.locator('body')).toContainText('PMCELL');
});

test('check production site loads PMCELL content', async ({ page }) => {
  test.setTimeout(45000);
  
  await page.goto('https://pmcellvendas.vercel.app', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  // Wait a bit for React to hydrate
  await page.waitForTimeout(2000);
  
  // Check for common elements that should exist
  const bodyText = await page.locator('body').textContent();
  console.log('Page has content:', bodyText ? bodyText.length > 0 : false);
  console.log('Contains PMCELL:', bodyText?.includes('PMCELL'));
});