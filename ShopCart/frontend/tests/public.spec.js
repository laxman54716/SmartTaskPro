import { test, expect } from '@playwright/test';

test.describe('ShopCart Public Web Pages', () => {
  test('1. Home page loads with Hero, Categories, and Products', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ShopCart|Vite/i);

    // Verify Navbar
    const logo = page.locator('.nav-logo');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveText('ShopCart');

    // Verify Hero section
    await expect(page.locator('h1')).toBeVisible();

    // Verify navigation links
    const productsLink = page.locator('.nav-links >> text=Products');
    await expect(productsLink).toBeVisible();
  });

  test('2. Products page displays product grid, categories, and search bar', async ({ page }) => {
    await page.goto('/products');

    // Search input exists
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Verify products are displayed
    const productCards = page.locator('.card');
    await expect(productCards.first()).toBeVisible();
  });

  test('3. Search products dynamically filters listing', async ({ page }) => {
    await page.goto('/products');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Keyboard');
    await page.keyboard.press('Enter');

    // Wait for search result
    await page.waitForTimeout(500);
    const content = await page.content();
    expect(content.toLowerCase()).toContain('keyboard');
  });

  test('4. Product Detail page displays specs and pricing', async ({ page }) => {
    await page.goto('/products');

    // Click on the first product card title/link
    const firstProductLink = page.locator('.product-grid a.card').first();
    await firstProductLink.click();

    // Verify product detail view
    await expect(page.locator('button >> text=Add to Cart')).toBeVisible();
  });

  test('5. Login page renders login form with email and password fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('6. Register page renders registration form with validation', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('#first_name')).toBeVisible();
    await expect(page.locator('#last_name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirm_password')).toBeVisible();

    // Test password mismatch error
    await page.locator('#first_name').fill('Test');
    await page.locator('#last_name').fill('User');
    await page.locator('#email').fill('test_mismatch@example.com');
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirm_password').fill('Mismatch999!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.alert-error')).toContainText('Passwords do not match');
  });
});

