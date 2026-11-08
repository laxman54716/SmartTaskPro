const request = require('supertest');
const app = require('../src/app');
const { createTestUser, createTestProduct } = require('./helpers');

describe('Cart API (/api/cart)', () => {
  let customer1, customer2;
  let inStockProduct, outOfStockProduct, inactiveProduct;

  beforeAll(async () => {
    customer1 = await createTestUser({ email: `cart_user1_${Date.now()}@example.com` });
    customer2 = await createTestUser({ email: `cart_user2_${Date.now()}@example.com` });

    inStockProduct = await createTestProduct({
      name: 'Mechanical Keycaps Set',
      price: 30.00,
      stock_quantity: 10,
      is_active: true
    });

    outOfStockProduct = await createTestProduct({
      name: 'Zero Stock Cable',
      price: 15.00,
      stock_quantity: 0,
      is_active: true
    });

    inactiveProduct = await createTestProduct({
      name: 'Inactive Mousepad',
      price: 20.00,
      stock_quantity: 50,
      is_active: false
    });
  });

  describe('Cart Operations', () => {
    it('1. Get empty cart returns 200 with 0 items', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.subtotal).toBe(0);
      expect(res.body.data.item_count).toBe(0);
    });

    it('2. Add product to cart returns 201 with updated cart and calculations', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: inStockProduct.id, quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].product_id).toBe(inStockProduct.id);
      expect(res.body.data.items[0].quantity).toBe(2);

      // Calculations: 2 * 30 = 60 (subtotal > 50 so shipping is 0)
      expect(res.body.data.subtotal).toBe(60.00);
      expect(res.body.data.tax).toBe(4.80); // 8% of 60
      expect(res.body.data.shipping).toBe(0);
      expect(res.body.data.total).toBe(64.80);
    });

    it('3. Add same product again merges quantity', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: inStockProduct.id, quantity: 1 });

      expect(res.status).toBe(201);
      expect(res.body.data.items[0].quantity).toBe(3);
    });

    it('4. Reject adding quantity greater than available stock (400)', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: inStockProduct.id, quantity: 50 }); // stock is 10

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('available in stock');
    });

    it('5. Reject adding zero or negative quantity (422)', async () => {
      const resZero = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: inStockProduct.id, quantity: 0 });
      expect(resZero.status).toBe(422);

      const resNeg = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: inStockProduct.id, quantity: -2 });
      expect(resNeg.status).toBe(422);
    });

    it('6. Reject adding nonexistent product (404)', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: 999999, quantity: 1 });
      expect(res.status).toBe(404);
    });

    it('7. Reject adding inactive product (400)', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: inactiveProduct.id, quantity: 1 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not available');
    });

    it('8. Reject adding out-of-stock product (400)', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ product_id: outOfStockProduct.id, quantity: 1 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('available in stock');
    });

    it('9. Update cart item quantity', async () => {
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customer1.token}`);
      const itemId = cartRes.body.data.items[0].id;

      const res = await request(app)
        .put(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ quantity: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].quantity).toBe(1);

      // Calculations for 1 item ($30 <= 50, shipping is $5.99):
      expect(res.body.data.subtotal).toBe(30.00);
      expect(res.body.data.tax).toBe(2.40);
      expect(res.body.data.shipping).toBe(5.99);
      expect(res.body.data.total).toBe(38.39);
    });

    it('10. Reject updating quantity beyond stock (400)', async () => {
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customer1.token}`);
      const itemId = cartRes.body.data.items[0].id;

      const res = await request(app)
        .put(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ quantity: 99 });

      expect(res.status).toBe(400);
    });

    it('11. Customer2 cannot update Customer1 cart item (404)', async () => {
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customer1.token}`);
      const itemId = cartRes.body.data.items[0].id;

      const res = await request(app)
        .put(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${customer2.token}`)
        .send({ quantity: 2 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Cart item not found');
    });

    it('12. Remove cart item', async () => {
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customer1.token}`);
      const itemId = cartRes.body.data.items[0].id;

      const res = await request(app)
        .delete(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });

    it('13. Remove nonexistent cart item returns 404', async () => {
      const res = await request(app)
        .delete('/api/cart/items/999999')
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(404);
    });

    it('14. Clear cart succeeds even if already empty', async () => {
      const res = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('15. Access cart without auth returns 401', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.status).toBe(401);
    });
  });
});

