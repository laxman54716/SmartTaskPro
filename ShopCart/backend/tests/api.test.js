const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');

let token;
let productId;

// We use the same pool as the application, but we can't easily mock it cleanly without a massive refactor 
// for dependency injection, so these tests will run against the real DB. 
// In a production app, we would use a separate test database.

beforeAll(async () => {
  // Wait a moment for connection pool to be ready
  await new Promise(resolve => setTimeout(resolve, 500));
});

describe('ShopCart API Integration Tests', () => {
  
  describe('GET /api/products', () => {
    it('should return a paginated list of products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // Save a product ID for later tests if available
      if (res.body.data.length > 0) {
        productId = res.body.data[0].id;
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate a valid user and return a JWT token', async () => {
      // Use the seeded admin user
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopcart.com',
          password: 'Password123!'
        });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@shopcart.com');
      
      token = res.body.data.token;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@shopcart.com',
          password: 'wrongpassword'
        });
        
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should retrieve current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@shopcart.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
    });
  });
});
