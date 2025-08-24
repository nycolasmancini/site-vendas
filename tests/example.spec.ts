import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/PMCell/);
});

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Check for main navigation or header elements
  await expect(page.locator('body')).toBeVisible();
  
  // Check if the page loads without any major errors
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');

  // Test navigation to different pages (adjust selectors based on your actual navigation)
  // This is a generic test - you'll want to customize based on your actual navigation
  const navigation = page.locator('nav, header');
  if (await navigation.count() > 0) {
    await expect(navigation).toBeVisible();
  }
});

test('responsive design check', async ({ page }) => {
  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();

  // Test desktop viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});