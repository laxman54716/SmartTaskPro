const request = require('supertest');
const app = require('../src/app');
const { db, createTestUser, createTestProduct } = require('./helpers');

describe('Security Audit & Vulnerability Testing', () => {
  let customer, admin;

  beforeAll(async () => {
    customer = await createTestUser({ role: 'customer', email: `sec_cust_${Date.now()}@example.com` });
    admin = await createTestUser({ role: 'admin', email: `sec_admin_${Date.now()}@example.com` });
  });

  describe('Security Headers (Helmet) & Rate Limiting', () => {
    it('1. Helmet sets essential security headers on responses', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
    });

    it('2. Rate limiting headers are present on /api/ endpoints', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Injection & Data Sanitization', () => {
    it('1. SQL Injection on login endpoint is rejected safely', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR '1'='1' --",
          password: "' OR '1'='1'"
        });
      // Email validation catches it as invalid email
      expect(res.status).toBe(422);
    });

    it('2. SQL Injection in product search is safely parameterized', async () => {
      const sqli = "1'; DROP TABLE cart_items; --";
      const res = await request(app).get(`/api/products?search=${encodeURIComponent(sqli)}`);
      expect(res.status).toBe(200);

      // Verify cart_items table still exists and wasn't dropped
      const check = await db.query('SELECT count(*) FROM cart_items');
      expect(check).toBeDefined();
    });

    it('3. Cross-Site Scripting (XSS) input stored safely without unescaped execution', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const prod = await createTestProduct({ name: xssPayload });

      const res = await request(app).get(`/api/products/${prod.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(xssPayload); // JSON API returns literal string, not executable HTML
    });
  });

  describe('Authentication & Authorization Hardening', () => {
    it('1. Password hashes are never exposed in profile or admin endpoints', async () => {
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customer.token}`);
      expect(meRes.body.data.password_hash).toBeUndefined();
      expect(meRes.body.data.password).toBeUndefined();

      const custRes = await request(app)
        .get('/api/admin/customers')
        .set('Authorization', `Bearer ${admin.token}`);
      custRes.body.data.forEach(u => {
        expect(u.password_hash).toBeUndefined();
      });
    });

    it('2. Customer cannot escalate to admin endpoints (403)', async () => {
      const endpoints = [
        ['get', '/api/admin/dashboard'],
        ['get', '/api/admin/customers'],
        ['get', '/api/admin/orders'],
        ['get', '/api/admin/products'],
        ['post', '/api/products'],
        ['post', '/api/categories']
      ];

      for (const [method, url] of endpoints) {
        const res = await request(app)[method](url).set('Authorization', `Bearer ${customer.token}`);
        expect([403]).toContain(res.status);
      }
    });

    it('3. Inactive products cannot be added to cart or ordered', async () => {
      const inactive = await createTestProduct({ is_active: false });
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({ product_id: inactive.id, quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not available');
    });
  });
});

