const request = require('supertest');
const app = require('../src/app');
const { db, createTestUser } = require('./helpers');
const jwt = require('jsonwebtoken');

describe('Authentication & User Profile API (/api/auth)', () => {
  let customerUser;
  let customerToken;

  beforeAll(async () => {
    const res = await createTestUser({ email: `auth_suite_${Date.now()}@example.com` });
    customerUser = res.user;
    customerToken = res.token;
  });

  describe('POST /api/auth/register', () => {
    it('1. Register with valid details and create user + cart + token', async () => {
      const uniqueEmail = `valid_reg_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: uniqueEmail,
          password: 'Password123!',
          confirm_password: 'Password123!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(uniqueEmail.toLowerCase());
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.user.password_hash).toBeUndefined();

      // Verify cart created in DB
      const cartRes = await db.query('SELECT id FROM carts WHERE user_id = $1', [res.body.data.user.id]);
      expect(cartRes.rows.length).toBe(1);

      // Verify password hashed
      const userDb = await db.query('SELECT password_hash FROM users WHERE id = $1', [res.body.data.user.id]);
      expect(userDb.rows[0].password_hash).not.toBe('Password123!');
      expect(userDb.rows[0].password_hash.startsWith('$2')).toBe(true);
    });

    it('2. Register with existing email (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: customerUser.email,
          password: 'Password123!',
          confirm_password: 'Password123!'
        });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('3. Register with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'not-an-email',
          password: 'Password123!',
          confirm_password: 'Password123!'
        });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('4. Register without first_name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          last_name: 'Doe',
          email: `nofirst_${Date.now()}@example.com`,
          password: 'Password123!',
          confirm_password: 'Password123!'
        });
      expect(res.status).toBe(422);
    });

    it('5. Register without last_name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Jane',
          email: `nolast_${Date.now()}@example.com`,
          password: 'Password123!',
          confirm_password: 'Password123!'
        });
      expect(res.status).toBe(422);
    });

    it('6. Register without password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: `nopass_${Date.now()}@example.com`
        });
      expect(res.status).toBe(422);
    });

    it('7. Register with password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: `short_${Date.now()}@example.com`,
          password: 'Pass1',
          confirm_password: 'Pass1'
        });
      expect(res.status).toBe(422);
    });

    it('8. Register with password without uppercase letters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: `noupper_${Date.now()}@example.com`,
          password: 'password123!',
          confirm_password: 'password123!'
        });
      expect(res.status).toBe(422);
    });

    it('9. Register with password without numbers', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: `nonum_${Date.now()}@example.com`,
          password: 'Password!',
          confirm_password: 'Password!'
        });
      expect(res.status).toBe(422);
    });

    it('10. Register with mismatched confirm_password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: `mismatch_${Date.now()}@example.com`,
          password: 'Password123!',
          confirm_password: 'Different123!'
        });
      expect(res.status).toBe(422);
    });

    it('11. Register with empty request body', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(422);
    });

    it('12. Register with null values', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: null,
          last_name: null,
          email: null,
          password: null,
          confirm_password: null
        });
      expect(res.status).toBe(422);
    });

    it('13. Register with special characters in names', async () => {
      const email = `special_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: "O'Connor-Smith",
          last_name: "Renée",
          email,
          password: 'Password123!',
          confirm_password: 'Password123!'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.user.first_name).toBe("O'Connor-Smith");
    });

    it('14. Register with extremely long input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'A'.repeat(150),
          last_name: 'B'.repeat(150),
          email: `toolong_${Date.now()}@example.com`,
          password: 'Password123!',
          confirm_password: 'Password123!'
        });
      expect(res.status).toBe(422);
    });

    it('15. Register with leading/trailing spaces and different casing', async () => {
      const baseEmail = `cased_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: '  Alice  ',
          last_name: '  Wonderland  ',
          email: `  ${baseEmail.toUpperCase()}  `,
          password: 'Password123!',
          confirm_password: 'Password123!'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe(baseEmail.toLowerCase());
      expect(res.body.data.user.first_name).toBe('Alice');
    });
  });

  describe('POST /api/auth/login', () => {
    it('1. Login with correct credentials returns JWT and user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: customerUser.email,
          password: 'Password123!'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password_hash).toBeUndefined();

      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(customerUser.id);
      expect(decoded.role).toBe(customerUser.role);
    });

    it('2. Login with incorrect password returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: customerUser.email,
          password: 'WrongPassword999!'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('3. Login with unknown email returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown_nonexistent@example.com',
          password: 'Password123!'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('4. Login with empty email returns 422', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: 'Password123!' });
      expect(res.status).toBe(422);
    });

    it('5. Login with empty password returns 422', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: customerUser.email, password: '' });
      expect(res.status).toBe(422);
    });

    it('6. Login with invalid email format returns 422', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bad-email-format', password: 'Password123!' });
      expect(res.status).toBe(422);
    });

    it('7. Login with uppercase email still succeeds (case insensitivity)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: customerUser.email.toUpperCase(),
          password: 'Password123!'
        });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('8. Login with null values returns 422', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: null, password: null });
      expect(res.status).toBe(422);
    });
  });

  describe('JWT Authentication Tests', () => {
    it('1. Access protected API without token (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('2. Access protected API with valid token (200)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(customerUser.email);
    });

    it('3. Access protected API with invalid token (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');
      expect(res.status).toBe(401);
    });

    it('4. Access protected API with expired token (401)', async () => {
      const expiredToken = jwt.sign({ id: customerUser.id, role: customerUser.role }, process.env.JWT_SECRET, { expiresIn: '-1s' });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token expired');
    });

    it('5. Access protected API with malformed token (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer 123456');
      expect(res.status).toBe(401);
    });

    it('6. Access protected API with empty Bearer (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ');
      expect(res.status).toBe(401);
    });

    it('7. Access protected API after deleting associated user (401)', async () => {
      const temp = await createTestUser({ email: `deleted_user_${Date.now()}@example.com` });
      await db.query('DELETE FROM carts WHERE user_id = $1', [temp.user.id]);
      await db.query('DELETE FROM users WHERE id = $1', [temp.user.id]);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${temp.token}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('User not found');
    });

    it('8. Tampered token payload with invalid signature (401)', async () => {
      const fakeToken = jwt.sign({ id: customerUser.id, role: 'admin' }, 'wrong-secret-key-123');
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`);
      expect(res.status).toBe(401);
    });
  });

  describe('User Profile & Password Management', () => {
    it('1. GET /api/auth/me returns user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(customerUser.id);
      expect(res.body.data.email).toBe(customerUser.email);
    });

    it('2. PUT /api/auth/me updates first name and phone', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          first_name: 'UpdatedFirst',
          phone: '9998887776'
        });
      expect(res.status).toBe(200);
      expect(res.body.data.first_name).toBe('UpdatedFirst');
      expect(res.body.data.phone).toBe('9998887776');
    });

    it('3. PUT /api/auth/me rejects empty name with 422', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          first_name: ''
        });
      expect(res.status).toBe(422);
    });

    it('4. Change password with correct current password succeeds', async () => {
      const temp = await createTestUser({ email: `pwd_change_${Date.now()}@example.com` });

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${temp.token}`)
        .send({
          current_password: 'Password123!',
          new_password: 'NewPassword999!'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login with new password
      const loginNew = await request(app)
        .post('/api/auth/login')
        .send({
          email: temp.user.email,
          password: 'NewPassword999!'
        });
      expect(loginNew.status).toBe(200);

      // Verify old password fails
      const loginOld = await request(app)
        .post('/api/auth/login')
        .send({
          email: temp.user.email,
          password: 'Password123!'
        });
      expect(loginOld.status).toBe(401);
    });

    it('5. Change password with incorrect current password returns 400', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          current_password: 'WrongCurrentPassword123!',
          new_password: 'AnotherPassword999!'
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Current password is incorrect');
    });

    it('6. Change password with weak new password returns 422', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          current_password: 'Password123!',
          new_password: 'weak'
        });
      expect(res.status).toBe(422);
    });
  });
});

