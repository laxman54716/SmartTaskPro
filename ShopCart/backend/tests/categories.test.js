const request = require('supertest');
const app = require('../src/app');
const { db, createTestUser, createTestCategory, createTestProduct } = require('./helpers');

describe('Category API (/api/categories)', () => {
  let adminToken, customerToken;
  let testCat;

  beforeAll(async () => {
    const admin = await createTestUser({ role: 'admin', email: `admin_cat_${Date.now()}@example.com` });
    adminToken = admin.token;

    const customer = await createTestUser({ role: 'customer', email: `cust_cat_${Date.now()}@example.com` });
    customerToken = customer.token;

    testCat = await createTestCategory({ name: `ExistingCat_${Date.now()}` });
  });

  describe('GET /api/categories', () => {
    it('1. Get all active categories (Public)', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(c => c.id === testCat.id)).toBe(true);
    });

    it('2. Get category by ID', async () => {
      const res = await request(app).get(`/api/categories/${testCat.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testCat.id);
      expect(res.body.data.name).toBe(testCat.name);
    });

    it('3. Get nonexistent category returns 404', async () => {
      const res = await request(app).get('/api/categories/999999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('4. Get invalid category ID returns 400', async () => {
      const res = await request(app).get('/api/categories/invalid-id');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/categories (Admin Only)', () => {
    it('1. Create valid category as Admin returns 201', async () => {
      const catName = `NewCategory_${Date.now()}`;
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: catName, description: 'Brand new category' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(catName);
      expect(res.body.data.is_active).toBe(true);
    });

    it('2. Create duplicate category returns 409', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: testCat.name });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('3. Create empty category name returns 422', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(422);
    });

    it('4. Customer cannot create category (403)', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Hacked Cat' });

      expect(res.status).toBe(403);
    });

    it('5. Unauthenticated user cannot create category (401)', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Unauth Cat' });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/categories/:id (Admin Only)', () => {
    it('1. Update category name', async () => {
      const cat = await createTestCategory();
      const updatedName = `Renamed_${Date.now()}`;
      const res = await request(app)
        .put(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: updatedName });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(updatedName);
    });

    it('2. Update category description only (partial update)', async () => {
      const cat = await createTestCategory({ name: `KeepName_${Date.now()}`, description: 'Old' });
      const res = await request(app)
        .put(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'New Fresh Description' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('New Fresh Description');
      expect(res.body.data.name).toBe(cat.name);
    });

    it('3. Update nonexistent category returns 404', async () => {
      const res = await request(app)
        .put('/api/categories/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost Cat' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('1. Delete category without associated products hard deletes (200)', async () => {
      const emptyCat = await createTestCategory();
      const res = await request(app)
        .delete(`/api/categories/${emptyCat.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      const check = await db.query('SELECT id FROM categories WHERE id = $1', [emptyCat.id]);
      expect(check.rows.length).toBe(0);
    });

    it('2. Delete category with associated products soft deactivates (200)', async () => {
      const catWithProd = await createTestCategory();
      await createTestProduct({ category_id: catWithProd.id });

      const res = await request(app)
        .delete(`/api/categories/${catWithProd.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deactivated).toBe(true);

      // Verify category still exists in DB but is_active = false
      const check = await db.query('SELECT is_active FROM categories WHERE id = $1', [catWithProd.id]);
      expect(check.rows[0].is_active).toBe(false);
    });

    it('3. Customer cannot delete category (403)', async () => {
      const res = await request(app)
        .delete(`/api/categories/${testCat.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });
});

