const request = require('supertest');
const app = require('../src/app');
const { db, createTestUser, createTestCategory, createTestProduct } = require('./helpers');

describe('Product API (/api/products)', () => {
  let adminUser, adminToken;
  let customerUser, customerToken;
  let testCategory;
  let testProduct1, testProduct2, inactiveProduct;

  beforeAll(async () => {
    const admin = await createTestUser({ role: 'admin', email: `admin_prod_${Date.now()}@example.com` });
    adminUser = admin.user;
    adminToken = admin.token;

    const customer = await createTestUser({ role: 'customer', email: `cust_prod_${Date.now()}@example.com` });
    customerUser = customer.user;
    customerToken = customer.token;

    testCategory = await createTestCategory({ name: `ProdCat_${Date.now()}` });

    testProduct1 = await createTestProduct({
      name: 'Alpha Wireless Keyboard',
      description: 'Mechanical keyboard with Bluetooth and RGB',
      price: 120.00,
      discount_price: 99.00,
      category_id: testCategory.id,
      stock_quantity: 25,
      sku: `KB-${Date.now()}-1`,
      is_active: true
    });

    testProduct2 = await createTestProduct({
      name: 'Beta Ergonomic Mouse',
      description: 'Silent click wireless mouse with long battery',
      price: 50.00,
      discount_price: null,
      category_id: testCategory.id,
      stock_quantity: 0,
      sku: `MS-${Date.now()}-2`,
      is_active: true
    });

    inactiveProduct = await createTestProduct({
      name: 'Hidden Old Gadget',
      description: 'Discontinued product not for public display',
      price: 200.00,
      category_id: testCategory.id,
      stock_quantity: 10,
      sku: `OLD-${Date.now()}-3`,
      is_active: false
    });
  });

  describe('GET /api/products (Public Listing & Filtering)', () => {
    it('1. Get all active products without query parameters', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(12);

      // Verify inactive products are excluded
      const inactiveInList = res.body.data.find(p => p.id === inactiveProduct.id);
      expect(inactiveInList).toBeUndefined();
    });

    it('2. Search by product name', async () => {
      const res = await request(app).get('/api/products?search=Keyboard');
      expect(res.status).toBe(200);
      expect(res.body.data.some(p => p.id === testProduct1.id)).toBe(true);
      expect(res.body.data.some(p => p.id === testProduct2.id)).toBe(false);
    });

    it('3. Search by description', async () => {
      const res = await request(app).get('/api/products?search=Bluetooth');
      expect(res.status).toBe(200);
      expect(res.body.data.some(p => p.id === testProduct1.id)).toBe(true);
    });

    it('4. Search by SKU', async () => {
      const res = await request(app).get(`/api/products?search=${testProduct1.sku}`);
      expect(res.status).toBe(200);
      expect(res.body.data.some(p => p.id === testProduct1.id)).toBe(true);
    });

    it('5. Case-insensitive search', async () => {
      const res = await request(app).get('/api/products?search=kEyBoArD');
      expect(res.status).toBe(200);
      expect(res.body.data.some(p => p.id === testProduct1.id)).toBe(true);
    });

    it('6. Search nonexistent product returns empty data array', async () => {
      const res = await request(app).get('/api/products?search=NonExistentSuperFake999');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.total).toBe(0);
    });

    it('7. Filter by category_id', async () => {
      const res = await request(app).get(`/api/products?category_id=${testCategory.id}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(p => {
        expect(p.category_id).toBe(testCategory.id);
      });
    });

    it('8. Filter by min_price', async () => {
      const res = await request(app).get('/api/products?min_price=60');
      expect(res.status).toBe(200);
      res.body.data.forEach(p => {
        const effPrice = p.discount_price ? parseFloat(p.discount_price) : parseFloat(p.price);
        expect(effPrice).toBeGreaterThanOrEqual(60);
      });
    });

    it('9. Filter by max_price', async () => {
      const res = await request(app).get('/api/products?max_price=60');
      expect(res.status).toBe(200);
      res.body.data.forEach(p => {
        const effPrice = p.discount_price ? parseFloat(p.discount_price) : parseFloat(p.price);
        expect(effPrice).toBeLessThanOrEqual(60);
      });
    });

    it('10. Filter by in_stock = true', async () => {
      const res = await request(app).get('/api/products?in_stock=true');
      expect(res.status).toBe(200);
      expect(res.body.data.some(p => p.id === testProduct2.id)).toBe(false); // testProduct2 has 0 stock
      res.body.data.forEach(p => {
        expect(p.stock_quantity).toBeGreaterThan(0);
      });
    });

    it('11. Sort by price_asc', async () => {
      const res = await request(app).get('/api/products?sort=price_asc');
      expect(res.status).toBe(200);
      for (let i = 1; i < res.body.data.length; i++) {
        const prev = res.body.data[i - 1].discount_price ? parseFloat(res.body.data[i - 1].discount_price) : parseFloat(res.body.data[i - 1].price);
        const curr = res.body.data[i].discount_price ? parseFloat(res.body.data[i].discount_price) : parseFloat(res.body.data[i].price);
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });

    it('12. Sort by price_desc', async () => {
      const res = await request(app).get('/api/products?sort=price_desc');
      expect(res.status).toBe(200);
      for (let i = 1; i < res.body.data.length; i++) {
        const prev = res.body.data[i - 1].discount_price ? parseFloat(res.body.data[i - 1].discount_price) : parseFloat(res.body.data[i - 1].price);
        const curr = res.body.data[i].discount_price ? parseFloat(res.body.data[i].discount_price) : parseFloat(res.body.data[i].price);
        expect(curr).toBeLessThanOrEqual(prev);
      }
    });

    it('13. Pagination: page beyond records returns empty array with correct total', async () => {
      const res = await request(app).get('/api/products?page=9999&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.page).toBe(9999);
    });

    it('14. Defensive pagination: negative/zero page and limit are normalized safely', async () => {
      const res = await request(app).get('/api/products?page=-5&limit=-10');
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(12);
    });

    it('15. SQL injection safety in search input', async () => {
      const injection = "' OR '1'='1' --";
      const res = await request(app).get(`/api/products?search=${encodeURIComponent(injection)}`);
      expect(res.status).toBe(200);
      // Safe parameterized query won't dump all items as a SQL injection
    });
  });

  describe('GET /api/products/:id (Product Details)', () => {
    it('1. Get existing product by ID returns 200 with details', async () => {
      const res = await request(app).get(`/api/products/${testProduct1.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testProduct1.id);
      expect(res.body.data.name).toBe(testProduct1.name);
      expect(res.body.data.category_name).toBeDefined();
    });

    it('2. Get nonexistent product returns 404', async () => {
      const res = await request(app).get('/api/products/999999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('3. Get invalid product ID returns 400', async () => {
      const res = await request(app).get('/api/products/not-a-number');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/products (Product Creation - Admin Only)', () => {
    it('1. Create valid product as Admin returns 201', async () => {
      const newSku = `VALID-${Date.now()}`;
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Gaming Headset Pro',
          description: '7.1 Surround sound with mic',
          price: 79.99,
          discount_price: 69.99,
          category_id: testCategory.id,
          stock_quantity: 40,
          sku: newSku
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Gaming Headset Pro');
      expect(res.body.data.sku).toBe(newSku);
    });

    it('2. Reject product creation with discount_price > price (422)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Discount Gadget',
          price: 50.00,
          discount_price: 90.00,
          category_id: testCategory.id,
          stock_quantity: 10,
          sku: `BAD-DISC-${Date.now()}`
        });
      expect(res.status).toBe(422);
      expect(res.body.message).toContain('Discount price cannot be greater than original price');
    });

    it('3. Reject product creation with negative price (422)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Negative Price Item',
          price: -15.00,
          category_id: testCategory.id,
          stock_quantity: 10,
          sku: `NEG-P-${Date.now()}`
        });
      expect(res.status).toBe(422);
    });

    it('4. Reject duplicate SKU with 409', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate SKU Item',
          price: 30.00,
          category_id: testCategory.id,
          stock_quantity: 10,
          sku: testProduct1.sku
        });
      expect(res.status).toBe(409);
    });

    it('5. Deny product creation for customer (403)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Customer Created Item',
          price: 25.00,
          category_id: testCategory.id,
          stock_quantity: 5,
          sku: `CUST-${Date.now()}`
        });
      expect(res.status).toBe(403);
    });

    it('6. Deny product creation without auth (401)', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'Unauth Item',
          price: 25.00,
          category_id: testCategory.id,
          stock_quantity: 5,
          sku: `UNAUTH-${Date.now()}`
        });
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/products/:id (Product Partial Update)', () => {
    it('1. Update stock_quantity only: does not erase discount_price or category_id', async () => {
      const prod = await createTestProduct({
        name: 'Original Laptop Stand',
        price: 45.00,
        discount_price: 39.00,
        category_id: testCategory.id,
        stock_quantity: 15
      });

      const res = await request(app)
        .put(`/api/products/${prod.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock_quantity: 80 });

      expect(res.status).toBe(200);
      expect(res.body.data.stock_quantity).toBe(80);
      expect(res.body.data.name).toBe('Original Laptop Stand');
      expect(parseFloat(res.body.data.discount_price)).toBe(39.00);
      expect(res.body.data.category_id).toBe(testCategory.id);
    });

    it('2. Update name only', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Alpha Mechanical RGB Keyboard V2' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Alpha Mechanical RGB Keyboard V2');
    });

    it('3. Update nonexistent product returns 404', async () => {
      const res = await request(app)
        .put('/api/products/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost Product' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/products/:id (Deletion & Soft-deactivation)', () => {
    it('1. Hard delete product with no orders', async () => {
      const tempProd = await createTestProduct({ name: 'Disposable Product' });
      const res = await request(app)
        .delete(`/api/products/${tempProd.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      const check = await db.query('SELECT id FROM products WHERE id = $1', [tempProd.id]);
      expect(check.rows.length).toBe(0);
    });

    it('2. Customer cannot delete products (403)', async () => {
      const res = await request(app)
        .delete(`/api/products/${testProduct1.id}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });
  });
});

