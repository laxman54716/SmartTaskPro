const db = require('../src/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../src/utils/jwt');

const cleanTestDb = async () => {
  // Clean in dependency order
  await db.query('DELETE FROM order_items');
  await db.query('DELETE FROM orders');
  await db.query('DELETE FROM cart_items');
  await db.query('DELETE FROM carts');
  await db.query('DELETE FROM addresses');
  await db.query('DELETE FROM products');
  await db.query('DELETE FROM categories');
  await db.query("DELETE FROM users WHERE email NOT IN ('admin@shopcart.com', 'alice@example.com', 'bob@example.com')");
};

const createTestUser = async ({
  first_name = 'Test',
  last_name = 'User',
  email = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
  password = 'Password123!',
  role = 'customer',
  phone = '9876543210'
} = {}) => {
  const hash = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, first_name, last_name, email, role, phone, created_at`,
    [first_name, last_name, email.toLowerCase(), hash, role, phone]
  );
  const user = result.rows[0];
  await db.query('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);
  const token = generateToken({ id: user.id, role: user.role });
  return { user, token, rawPassword: password };
};

const createTestCategory = async ({
  name = `Category_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  description = 'Test Category Description',
  is_active = true
} = {}) => {
  const result = await db.query(
    'INSERT INTO categories (name, description, is_active) VALUES ($1, $2, $3) RETURNING *',
    [name, description, is_active]
  );
  return result.rows[0];
};

const createTestProduct = async ({
  name = `Product_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  description = 'Test Product Description',
  price = 100.00,
  discount_price = null,
  category_id = null,
  image_url = 'https://example.com/test.jpg',
  stock_quantity = 50,
  sku = `SKU-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
  is_active = true
} = {}) => {
  if (!category_id) {
    const cat = await createTestCategory();
    category_id = cat.id;
  }
  const result = await db.query(
    `INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, sku, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [name, description, price, discount_price, category_id, image_url, stock_quantity, sku, is_active]
  );
  return result.rows[0];
};

const createTestAddress = async (userId, {
  label = 'Home',
  address_line1 = '123 Test Street',
  address_line2 = 'Apt 4B',
  city = 'Bangalore',
  state = 'Karnataka',
  postal_code = '560001',
  country = 'India',
  phone = '9876543210',
  is_default = false
} = {}) => {
  const result = await db.query(
    `INSERT INTO addresses (user_id, label, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [userId, label, address_line1, address_line2, city, state, postal_code, country, phone, is_default]
  );
  return result.rows[0];
};

module.exports = {
  db,
  cleanTestDb,
  createTestUser,
  createTestCategory,
  createTestProduct,
  createTestAddress
};

