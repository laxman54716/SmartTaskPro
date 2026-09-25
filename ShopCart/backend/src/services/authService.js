const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken } = require('../utils/jwt');

const register = async ({ first_name, last_name, email, password }) => {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'customer')
     RETURNING id, first_name, last_name, email, role, created_at`,
    [first_name, last_name, email, password_hash]
  );

  const user = result.rows[0];

  // Create cart for new user
  await db.query('INSERT INTO carts (user_id) VALUES ($1)', [user.id]);

  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};

const login = async ({ email, password }) => {
  const result = await db.query(
    'SELECT id, first_name, last_name, email, password_hash, phone, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const { password_hash, ...userWithoutPassword } = user;
  const token = generateToken({ id: user.id, role: user.role });
  return { user: userWithoutPassword, token };
};

const getProfile = async (userId) => {
  const result = await db.query(
    'SELECT id, first_name, last_name, email, phone, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

const updateProfile = async (userId, { first_name, last_name, phone }) => {
  const result = await db.query(
    `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), phone = COALESCE($3, phone)
     WHERE id = $4
     RETURNING id, first_name, last_name, email, phone, role, created_at, updated_at`,
    [first_name, last_name, phone, userId]
  );
  return result.rows[0];
};

const changePassword = async (userId, { current_password, new_password }) => {
  const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
  if (!valid) {
    throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });
  }

  const password_hash = await bcrypt.hash(new_password, 10);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, userId]);
  return true;
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
