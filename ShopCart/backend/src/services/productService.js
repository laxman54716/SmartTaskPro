const db = require('../db');

const getProducts = async ({ page = 1, limit = 12, search, category_id, min_price, max_price, in_stock, sort }) => {
  const parsedPage = parseInt(page);
  const pageNum = (!isNaN(parsedPage) && parsedPage > 0) ? parsedPage : 1;
  const parsedLimit = parseInt(limit);
  const limitNum = (!isNaN(parsedLimit) && parsedLimit > 0) ? Math.min(100, parsedLimit) : 12;
  const offset = (pageNum - 1) * limitNum;
  const params = [];
  const conditions = ['p.is_active = true'];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (category_id && !isNaN(parseInt(category_id))) {
    conditions.push(`p.category_id = $${paramIndex}`);
    params.push(parseInt(category_id));
    paramIndex++;
  }

  if (min_price !== undefined && min_price !== '' && !isNaN(parseFloat(min_price))) {
    conditions.push(`COALESCE(p.discount_price, p.price) >= $${paramIndex}`);
    params.push(parseFloat(min_price));
    paramIndex++;
  }

  if (max_price !== undefined && max_price !== '' && !isNaN(parseFloat(max_price))) {
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

  params.push(limitNum);
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
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
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
  const sets = [];
  const params = [];
  let paramIndex = 1;

  if (name !== undefined) { sets.push(`name = $${paramIndex++}`); params.push(name); }
  if (description !== undefined) { sets.push(`description = $${paramIndex++}`); params.push(description); }
  if (price !== undefined) { sets.push(`price = $${paramIndex++}`); params.push(price); }
  if (discount_price !== undefined) { sets.push(`discount_price = $${paramIndex++}`); params.push(discount_price); }
  if (category_id !== undefined) { sets.push(`category_id = $${paramIndex++}`); params.push(category_id); }
  if (image_url !== undefined) { sets.push(`image_url = $${paramIndex++}`); params.push(image_url); }
  if (stock_quantity !== undefined) { sets.push(`stock_quantity = $${paramIndex++}`); params.push(stock_quantity); }
  if (sku !== undefined) { sets.push(`sku = $${paramIndex++}`); params.push(sku); }
  if (is_active !== undefined) { sets.push(`is_active = $${paramIndex++}`); params.push(is_active); }

  if (sets.length === 0) {
    return getProductById(id);
  }

  params.push(id);
  const result = await db.query(
    `UPDATE products SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
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
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;
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

  params.push(limitNum);
  params.push(offset);

  const result = await db.query(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return { products: result.rows, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) };
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getAllProductsAdmin };
