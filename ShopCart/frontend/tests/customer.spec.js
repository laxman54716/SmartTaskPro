import { test, expect } from '@playwright/test';

test.describe('Customer End-to-End Workflow', () => {
  const uniqueEmail = `e2e_cust_${Date.now()}@example.com`;

  test('Full Customer Flow: Register -> Browse -> Cart -> Address -> Checkout -> Order History', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // 1. Register new customer
    await page.goto('/register');
    await page.locator('#first_name').fill('Sarah');
    await page.locator('#last_name').fill('Connor');
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirm_password').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    // After register, user is redirected to home and logged in
    await page.waitForURL('/');
    await expect(page.locator('.nav-links')).toContainText('Profile');

    // 2. Add an Address
    await page.goto('/addresses');
    await page.locator('button >> text=+ Add New Address').click();
    await page.locator('#label').fill('Home Residence');
    await page.locator('#address_line1').fill('742 Evergreen Terrace');
    await page.locator('#city').fill('Springfield');
    await page.locator('#state').fill('Oregon');
    await page.locator('#postal_code').fill('97477');
    await page.locator('#phone').fill('5551234567');
    await page.locator('button[type="submit"]').click();

    // Wait for address to show up
    await expect(page.locator('.card')).toContainText('742 Evergreen Terrace');

    // 3. Browse Products and Add to Cart
    await page.goto('/products');
    const firstProduct = page.locator('.product-grid a.card').first();
    await firstProduct.click();

    // On product detail, click Add to Cart and wait for dialog
    const dialogPromise = page.waitForEvent('dialog');
    await page.locator('button >> text=Add to Cart').click();
    const dialog = await dialogPromise;
    await dialog.accept();

    // Ensure cart badge updated
    await expect(page.locator('.cart-badge')).toHaveText('1');

    // 4. View Cart
    await page.locator('.cart-icon-container').click();
    await page.waitForURL('/cart');
    await expect(page.locator('h1')).toContainText('Shopping Cart');
    await expect(page.locator('.btn-primary >> text=Proceed to Checkout')).toBeVisible();

    // 5. Checkout
    await page.locator('.btn-primary >> text=Proceed to Checkout').click();
    await page.waitForURL('/checkout');

    // Wait for address to load and select it
    const addressRadio = page.locator('input[name="address"]').first();
    await expect(addressRadio).toBeVisible();
    await addressRadio.check();

    // Select COD payment method
    await page.locator('input[value="cod"]').check();

    // Place Order
    await page.locator('button', { hasText: /Place Order|Pay/i }).click();

    // Wait for redirect to order detail page
    await page.waitForURL(/\/orders\/\d+/);
    await expect(page.locator('h1')).toContainText('Order #');

    // 6. View in Orders list
    await page.goto('/orders');
    await expect(page.locator('h1')).toContainText('Order History');
    await expect(page.locator('.card').first()).toBeVisible();

    // 7. Logout
    await page.locator('button >> text=Logout').click();
    await page.waitForURL(/\/(login)?$/);
    await expect(page.locator('.nav-links')).toContainText('Login');
  });
});

