import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard and Management Flow', () => {
  test('Admin Flow: Login -> Dashboard Stats -> View Orders -> Product Management', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.locator('#email').fill('admin@shopcart.com');
    await page.locator('#password').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    // Admin redirects to /admin dashboard
    await page.waitForURL('/admin');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');

    // 2. Verify Stats Cards
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('.card >> text=Customers')).toBeVisible();
    await expect(page.locator('.card >> text=Products')).toBeVisible();

    // 3. View Orders in Admin
    await page.goto('/admin/orders');
    await expect(page.locator('h1')).toContainText('Manage Orders');
    await expect(page.locator('table')).toBeVisible();

    // 4. View Products in Admin
    await page.goto('/admin/products');
    await expect(page.locator('h1')).toContainText('Manage Products');
    await expect(page.locator('table')).toBeVisible();
  });
});

