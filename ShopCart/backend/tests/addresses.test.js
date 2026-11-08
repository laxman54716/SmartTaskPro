const request = require('supertest');
const app = require('../src/app');
const { createTestUser, createTestAddress } = require('./helpers');

describe('Address API (/api/addresses)', () => {
  let customer1, customer2;
  let addr1;

  beforeAll(async () => {
    customer1 = await createTestUser({ email: `addr_user1_${Date.now()}@example.com` });
    customer2 = await createTestUser({ email: `addr_user2_${Date.now()}@example.com` });

    addr1 = await createTestAddress(customer1.user.id, {
      label: 'Home',
      address_line1: '100 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India',
      is_default: true
    });
  });

  describe('CRUD Operations & Validation', () => {
    it('1. Get all addresses for authenticated user', async () => {
      const res = await request(app)
        .get('/api/addresses')
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(a => a.id === addr1.id)).toBe(true);
    });

    it('2. Get address by ID', async () => {
      const res = await request(app)
        .get(`/api/addresses/${addr1.id}`)
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(addr1.id);
      expect(res.body.data.city).toBe('Mumbai');
    });

    it('3. Create new address and set as default (unsets previous default)', async () => {
      const res = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({
          label: 'Office',
          address_line1: 'Tech Park Tower 2',
          city: 'Bangalore',
          state: 'Karnataka',
          postal_code: '560100',
          country: 'India',
          is_default: true
        });

      expect(res.status).toBe(201);
      expect(res.body.data.is_default).toBe(true);

      // Verify previous address is no longer default
      const prevRes = await request(app)
        .get(`/api/addresses/${addr1.id}`)
        .set('Authorization', `Bearer ${customer1.token}`);
      expect(prevRes.body.data.is_default).toBe(false);
    });

    it('4. Update existing address (partial update does not erase address_line2)', async () => {
      const testAddr = await createTestAddress(customer1.user.id, {
        address_line1: '456 Garden St',
        address_line2: 'Suite 9',
        city: 'Pune',
        state: 'Maharashtra',
        postal_code: '411001',
        country: 'India'
      });

      const res = await request(app)
        .put(`/api/addresses/${testAddr.id}`)
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({ city: 'Pune City' });

      expect(res.status).toBe(200);
      expect(res.body.data.city).toBe('Pune City');
      expect(res.body.data.address_line2).toBe('Suite 9');
      expect(res.body.data.address_line1).toBe('456 Garden St');
    });

    it('5. Validation: Reject missing required address fields (422)', async () => {
      const res = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({
          label: 'Incomplete'
          // missing address_line1, city, state, postal_code, country
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('Address line 1 is required');
    });

    it('6. Isolation: Customer2 cannot access Customer1 address (404)', async () => {
      const res = await request(app)
        .get(`/api/addresses/${addr1.id}`)
        .set('Authorization', `Bearer ${customer2.token}`);

      expect(res.status).toBe(404);
    });

    it('7. Isolation: Customer2 cannot delete Customer1 address (404)', async () => {
      const res = await request(app)
        .delete(`/api/addresses/${addr1.id}`)
        .set('Authorization', `Bearer ${customer2.token}`);

      expect(res.status).toBe(404);
    });

    it('8. Delete address and verify it is removed', async () => {
      const toDelete = await createTestAddress(customer1.user.id, {
        address_line1: 'Delete Me St',
        city: 'Delhi',
        state: 'Delhi',
        postal_code: '110001',
        country: 'India'
      });

      const res = await request(app)
        .delete(`/api/addresses/${toDelete.id}`)
        .set('Authorization', `Bearer ${customer1.token}`);
      expect(res.status).toBe(200);

      const check = await request(app)
        .get(`/api/addresses/${toDelete.id}`)
        .set('Authorization', `Bearer ${customer1.token}`);
      expect(check.status).toBe(404);
    });
  });
});

