import { test, expect } from '@playwright/test';

test.describe('Frontend Route Authorization Guards', () => {
  test('1. Unauthenticated users visiting /cart are redirected to /login', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForURL('/login');
    await expect(page.locator('h2')).toContainText('Login to ShopCart');
  });

  test('2. Unauthenticated users visiting /checkout are redirected to /login', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForURL('/login');
  });

  test('3. Unauthenticated users visiting /admin are redirected to /login', async ({ page }) => {
    await page.goto('/admin');
    // AdminRoute redirects non-admin / unauth to / or /login
    await page.waitForURL(/\/(login)?$/);
  });

  test('4. Logged-in Customer visiting /admin is redirected to /', async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.locator('#email').fill('alice@example.com');
    await page.locator('#password').fill('Password123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');

    // Attempt direct navigation to /admin
    await page.goto('/admin');
    await page.waitForURL('/');
  });
});

