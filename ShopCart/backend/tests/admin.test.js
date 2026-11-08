const request = require('supertest');
const app = require('../src/app');
const { createTestUser, createTestProduct } = require('./helpers');

describe('Admin Management API (/api/admin)', () => {
  let admin, customer;

  beforeAll(async () => {
    admin = await createTestUser({ role: 'admin', email: `admin_mgmt_${Date.now()}@example.com` });
    customer = await createTestUser({ role: 'customer', email: `cust_mgmt_${Date.now()}@example.com` });
  });

  describe('GET /api/admin/dashboard', () => {
    it('1. Admin accesses dashboard returns statistics, revenue and low stock', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.total_customers).toBe('number');
      expect(typeof res.body.data.total_products).toBe('number');
      expect(typeof res.body.data.total_orders).toBe('number');
      expect(typeof res.body.data.total_revenue).toBe('number');
      expect(Array.isArray(res.body.data.low_stock_products)).toBe(true);
      expect(Array.isArray(res.body.data.recent_orders)).toBe(true);
    });

    it('2. Customer denied access to dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customer.token}`);
      expect(res.status).toBe(403);
    });

    it('3. Unauthenticated access denied to dashboard (401)', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/customers', () => {
    it('1. Admin gets customer list; password_hash is NEVER exposed', async () => {
      const res = await request(app)
        .get('/api/admin/customers')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach(c => {
        expect(c.password_hash).toBeUndefined();
        expect(c.password).toBeUndefined();
      });
    });

    it('2. Customer cannot access customer list (403)', async () => {
      const res = await request(app)
        .get('/api/admin/customers')
        .set('Authorization', `Bearer ${customer.token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/orders & Status Updates', () => {
    it('1. Admin gets all orders with pagination and filters', async () => {
      const res = await request(app)
        .get('/api/admin/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.page).toBe(1);
    });

    it('2. Filter orders by status', async () => {
      const res = await request(app)
        .get('/api/admin/orders?status=delivered')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(o => {
        expect(o.order_status).toBe('delivered');
      });
    });

    it('3. Admin updates order status and payment status', async () => {
      // Get any existing order
      const ordersRes = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${admin.token}`);

      if (ordersRes.body.data.length > 0) {
        const orderId = ordersRes.body.data[0].id;
        const res = await request(app)
          .put(`/api/admin/orders/${orderId}/status`)
          .set('Authorization', `Bearer ${admin.token}`)
          .send({ order_status: 'confirmed', payment_status: 'paid' });

        expect(res.status).toBe(200);
        expect(res.body.data.order_status).toBe('confirmed');
        expect(res.body.data.payment_status).toBe('paid');
      }
    });

    it('4. Admin updating nonexistent order returns 404', async () => {
      const res = await request(app)
        .put('/api/admin/orders/999999/status')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ order_status: 'shipped' });

      expect(res.status).toBe(404);
    });

    it('5. Admin submitting invalid status returns 400', async () => {
      const ordersRes = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${admin.token}`);

      if (ordersRes.body.data.length > 0) {
        const orderId = ordersRes.body.data[0].id;
        const res = await request(app)
          .put(`/api/admin/orders/${orderId}/status`)
          .set('Authorization', `Bearer ${admin.token}`)
          .send({ order_status: 'bogus_status' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Invalid order status');
      }
    });
  });

  describe('GET /api/admin/products', () => {
    it('1. Admin gets all products including inactive items', async () => {
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('2. Customer cannot access admin product list (403)', async () => {
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${customer.token}`);
      expect(res.status).toBe(403);
    });
  });
});

