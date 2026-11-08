import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Desktop Full HD (1920x1080)', width: 1920, height: 1080 },
  { name: 'Desktop Standard (1366x768)', width: 1366, height: 768 },
  { name: 'Desktop Compact (1280x720)', width: 1280, height: 720 },
  { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024 },
  { name: 'Mobile Standard (390x844)', width: 390, height: 844 },
  { name: 'Mobile Compact (360x800)', width: 360, height: 800 },
];

test.describe('Responsive Layout & Viewport Testing', () => {
  for (const vp of viewports) {
    test(`Home Page renders without horizontal overflow on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Verify no horizontal page overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflow).toBe(false);

      // Verify header and footer are visible
      await expect(page.locator('.navbar')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });

    test(`Products Page renders responsively on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/products');

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflow).toBe(false);

      // Verify cards render properly
      await expect(page.locator('.card').first()).toBeVisible();
    });

    test(`Login Page form adapts responsively on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflow).toBe(false);
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
    });
  }
});

