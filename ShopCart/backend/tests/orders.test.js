const request = require('supertest');
const app = require('../src/app');
const { db, createTestUser, createTestProduct, createTestAddress } = require('./helpers');

describe('Checkout and Order Management API (/api/orders)', () => {
  let customer1, customer2;
  let addr1, addr2;
  let prodA, prodB, limitedStockProd;

  beforeAll(async () => {
    customer1 = await createTestUser({ email: `order_user1_${Date.now()}@example.com` });
    customer2 = await createTestUser({ email: `order_user2_${Date.now()}@example.com` });

    addr1 = await createTestAddress(customer1.user.id, {
      address_line1: '100 Galaxy Way',
      city: 'Hyderabad',
      state: 'Telangana',
      postal_code: '500001'
    });

    addr2 = await createTestAddress(customer2.user.id, {
      address_line1: '200 Nebula Way',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postal_code: '600001'
    });

    prodA = await createTestProduct({
      name: 'Mechanical Keyboard Switch Set',
      price: 25.00,
      stock_quantity: 100,
      is_active: true
    });

    prodB = await createTestProduct({
      name: 'Custom Coiled Cable',
      price: 35.00,
      stock_quantity: 50,
      is_active: true
    });

    limitedStockProd = await createTestProduct({
      name: 'Limited Artisan Keycap',
      price: 45.00,
      stock_quantity: 1,
      is_active: true
    });
  });

  afterEach(() => {
    delete process.env.MOCK_PAYMENT_STATUS;
  });

  describe('Checkout & Pricing Calculations', () => {
    it('1. Checkout with empty cart returns 400', async () => {
      // Clear cart first
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customer1.token}`);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ address_id: addr1.id, payment_method: 'cod' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cart is empty');
    });

    it('2. Checkout without address_id returns 422', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ payment_method: 'cod' });

      expect(res.status).toBe(422);
    });

    it('3. Checkout using another customer address returns 404', async () => {
      // Add item to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: prodA.id, quantity: 1 });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ address_id: addr2.id, payment_method: 'cod' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Shipping address not found');
    });

    it('4. Checkout with invalid payment method returns 422', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ address_id: addr1.id, payment_method: 'bitcoin' });

      expect(res.status).toBe(422);
    });

    it('5. Successful checkout with COD, stock reduction, and pricing logic', async () => {
      // Setup cart: 1 of prodA ($25) -> subtotal $25 <= $50, so shipping is $5.99
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customer1.token}`);
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: prodA.id, quantity: 1 });

      const beforeStock = (await db.query('SELECT stock_quantity FROM products WHERE id = $1', [prodA.id])).rows[0].stock_quantity;

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ address_id: addr1.id, payment_method: 'cod' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const order = res.body.data;
      expect(order.order_number).toMatch(/^SC-/);
      expect(parseFloat(order.subtotal)).toBe(25.00);
      expect(parseFloat(order.tax)).toBe(2.00); // 8% of 25
      expect(parseFloat(order.shipping_fee)).toBe(5.99); // <= 50
      expect(parseFloat(order.total)).toBe(32.99); // 25 + 2 + 5.99
      expect(order.payment_method).toBe('cod');
      expect(order.payment_status).toBe('pending');
      expect(order.order_status).toBe('placed');

      // Verify stock reduced
      const afterStock = (await db.query('SELECT stock_quantity FROM products WHERE id = $1', [prodA.id])).rows[0].stock_quantity;
      expect(afterStock).toBe(beforeStock - 1);

      // Verify cart cleared
      const cartCheck = await request(app).get('/api/cart').set('Authorization', `Bearer ${customer1.token}`);
      expect(cartCheck.body.data.items.length).toBe(0);
    });

    it('6. Free shipping logic when subtotal > $50', async () => {
      // 1 of prodA ($25) + 1 of prodB ($35) = subtotal $60 > 50 -> shipping $0
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: prodA.id, quantity: 1 });
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: prodB.id, quantity: 1 });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ address_id: addr1.id, payment_method: 'cod' });

      expect(res.status).toBe(201);
      const order = res.body.data;
      expect(parseFloat(order.subtotal)).toBe(60.00);
      expect(parseFloat(order.tax)).toBe(4.80);
      expect(parseFloat(order.shipping_fee)).toBe(0.00);
      expect(parseFloat(order.total)).toBe(64.80);
    });

    it('7. Card payment success (deterministic mock)', async () => {
      process.env.MOCK_PAYMENT_STATUS = 'paid';

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: prodA.id, quantity: 1 });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ address_id: addr1.id, payment_method: 'card' });

      expect(res.status).toBe(201);
      expect(res.body.data.payment_status).toBe('paid');
    });

    it('8. Card payment failure rollbacks transaction completely', async () => {
      process.env.MOCK_PAYMENT_STATUS = 'failed';

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: prodA.id, quantity: 2 });

      const stockBefore = (await db.query('SELECT stock_quantity FROM products WHERE id = $1', [prodA.id])).rows[0].stock_quantity;

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ address_id: addr1.id, payment_method: 'card' });

      expect(res.status).toBe(402);
      expect(res.body.message).toContain('Payment failed');

      // Verify stock was NOT reduced
      const stockAfter = (await db.query('SELECT stock_quantity FROM products WHERE id = $1', [prodA.id])).rows[0].stock_quantity;
      expect(stockAfter).toBe(stockBefore);

      // Verify cart still contains the items
      const cartCheck = await request(app).get('/api/cart').set('Authorization', `Bearer ${customer1.token}`);
      expect(cartCheck.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('Order History, Details & Cancellation', () => {
    let placedOrder;

    beforeAll(async () => {
      // Place a clean order to test order details and cancellation
      process.env.MOCK_PAYMENT_STATUS = 'paid';
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customer1.token}`);
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: prodB.id, quantity: 1 });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ address_id: addr1.id, payment_method: 'card' });

      placedOrder = res.body.data;
    });

    it('1. GET /api/orders returns customer orders paginated', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(o => o.id === placedOrder.id)).toBe(true);
    });

    it('2. GET /api/orders/:id returns order with item details', async () => {
      const res = await request(app)
        .get(`/api/orders/${placedOrder.id}`)
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(placedOrder.id);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items[0].product_name).toBe(prodB.name);
    });

    it('3. Isolation: Customer2 cannot access Customer1 order (404)', async () => {
      const res = await request(app)
        .get(`/api/orders/${placedOrder.id}`)
        .set('Authorization', `Bearer ${customer2.token}`);

      expect(res.status).toBe(404);
    });

    it('4. Cancel placed order: restores inventory and sets payment_status = refunded', async () => {
      const stockBefore = (await db.query('SELECT stock_quantity FROM products WHERE id = $1', [prodB.id])).rows[0].stock_quantity;

      const res = await request(app)
        .put(`/api/orders/${placedOrder.id}/cancel`)
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order_status).toBe('cancelled');
      expect(res.body.data.payment_status).toBe('refunded');

      // Verify stock restored
      const stockAfter = (await db.query('SELECT stock_quantity FROM products WHERE id = $1', [prodB.id])).rows[0].stock_quantity;
      expect(stockAfter).toBe(stockBefore + 1);
    });

    it('5. Cannot cancel already cancelled order (400)', async () => {
      const res = await request(app)
        .put(`/api/orders/${placedOrder.id}/cancel`)
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Order cannot be cancelled at this stage');
    });
  });

  describe('Concurrency Testing', () => {
    it('Simultaneous checkouts competing for stock=1: exactly 1 succeeds, 1 rejected', async () => {
      // Both customers add the 1 remaining limitedStockProd to their cart
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customer1.token}`);
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customer2.token}`);

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: limitedStockProd.id, quantity: 1 });

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer2.token}`)
        .send({ product_id: limitedStockProd.id, quantity: 1 });

      // Run checkouts simultaneously
      const [req1, req2] = await Promise.all([
        request(app).post('/api/orders').set('Authorization', `Bearer ${customer1.token}`).send({ address_id: addr1.id, payment_method: 'cod' }),
        request(app).post('/api/orders').set('Authorization', `Bearer ${customer2.token}`).send({ address_id: addr2.id, payment_method: 'cod' })
      ]);

      const successCount = (req1.status === 201 ? 1 : 0) + (req2.status === 201 ? 1 : 0);
      const failCount = (req1.status >= 400 ? 1 : 0) + (req2.status >= 400 ? 1 : 0);

      expect(successCount).toBe(1);
      expect(failCount).toBe(1);

      // Verify stock never went negative
      const finalStock = (await db.query('SELECT stock_quantity FROM products WHERE id = $1', [limitedStockProd.id])).rows[0].stock_quantity;
      expect(finalStock).toBe(0);
    });
  });
});

