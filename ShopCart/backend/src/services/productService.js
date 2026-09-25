const db = require('../db');

const getProducts = async ({ page = 1, limit = 12, search, category_id, min_price, max_price, in_stock, sort }) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['p.is_active = true'];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (category_id) {
    conditions.push(`p.category_id = $${paramIndex}`);
    params.push(parseInt(category_id));
    paramIndex++;
  }

  if (min_price) {
    conditions.push(`COALESCE(p.discount_price, p.price) >= $${paramIndex}`);
    params.push(parseFloat(min_price));
    paramIndex++;
  }

  if (max_price) {
    conditions.push(`COALESCE(p.discount_price, p.price) <= $${paramIndex}`);
    params.push(parseFloat(max_price));
    paramIndex++;
  }

  if (in_stock === 'true') {
    conditions.push('p.stock_quantity > 0');
  }

  let orderBy = 'p.created_at DESC';
  switch (sort) {
    case 'price_asc': orderBy = 'COALESCE(p.discount_price, p.price) ASC'; break;
    case 'price_desc': orderBy = 'COALESCE(p.discount_price, p.price) DESC'; break;
    case 'name_asc': orderBy = 'p.name ASC'; break;
    case 'newest': orderBy = 'p.created_at DESC'; break;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM products p ${whereClause}`, params
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit);
  params.push(offset);

  const result = await db.query(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return {
    products: result.rows,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

const getProductById = async (id) => {
  const result = await db.query(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const createProduct = async (data) => {
  const { name, description, price, discount_price, category_id, image_url, stock_quantity, sku, is_active } = data;
  const result = await db.query(
    `INSERT INTO products (name, description, price, discount_price, category_id, image_url, stock_quantity, sku, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [name, description, price, discount_price || null, category_id || null, image_url, stock_quantity, sku, is_active !== false]
  );
  return result.rows[0];
};

const updateProduct = async (id, data) => {
  const { name, description, price, discount_price, category_id, image_url, stock_quantity, sku, is_active } = data;
  const result = await db.query(
    `UPDATE products SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       price = COALESCE($3, price),
       discount_price = $4,
       category_id = $5,
       image_url = COALESCE($6, image_url),
       stock_quantity = COALESCE($7, stock_quantity),
       sku = COALESCE($8, sku),
       is_active = COALESCE($9, is_active)
     WHERE id = $10
     RETURNING *`,
    [name, description, price, discount_price, category_id, image_url, stock_quantity, sku, is_active, id]
  );
  return result.rows[0] || null;
};

const deleteProduct = async (id) => {
  // Soft delete - check if product has order_items
  const orderCheck = await db.query('SELECT COUNT(*) FROM order_items WHERE product_id = $1', [id]);
  if (parseInt(orderCheck.rows[0].count) > 0) {
    await db.query('UPDATE products SET is_active = false WHERE id = $1', [id]);
    await db.query('DELETE FROM cart_items WHERE product_id = $1', [id]);
    return { deactivated: true };
  }
  const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) return null;
  return { deleted: true };
};

const getAllProductsAdmin = async ({ page = 1, limit = 20, search }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = '';
  let paramIndex = 1;

  if (search) {
    whereClause = `WHERE p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex}`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  const countResult = await db.query(`SELECT COUNT(*) FROM products p ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  params.push(limit);
  params.push(offset);

  const result = await db.query(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return { products: result.rows, page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) };
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getAllProductsAdmin };
