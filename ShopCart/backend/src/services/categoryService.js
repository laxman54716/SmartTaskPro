const db = require('../db');

const getCategories = async (includeInactive = false) => {
  const condition = includeInactive ? '' : 'WHERE is_active = true';
  const result = await db.query(`SELECT * FROM categories ${condition} ORDER BY name`);
  return result.rows;
};

const getCategoryById = async (id) => {
  const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createCategory = async ({ name, description }) => {
  const existing = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error('Category name already exists'), { statusCode: 409 });
  }
  const result = await db.query(
    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
    [name, description]
  );
  return result.rows[0];
};

const updateCategory = async (id, { name, description, is_active }) => {
  if (name) {
    const existing = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2', [name, id]);
    if (existing.rows.length > 0) {
      throw Object.assign(new Error('Category name already exists'), { statusCode: 409 });
    }
  }

  const sets = [];
  const params = [];
  let paramIndex = 1;

  if (name !== undefined) { sets.push(`name = $${paramIndex++}`); params.push(name); }
  if (description !== undefined) { sets.push(`description = $${paramIndex++}`); params.push(description); }
  if (is_active !== undefined) { sets.push(`is_active = $${paramIndex++}`); params.push(is_active); }

  if (sets.length === 0) {
    return getCategoryById(id);
  }

  params.push(id);
  const result = await db.query(
    `UPDATE categories SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return result.rows[0] || null;
};

const deleteCategory = async (id) => {
  const productCheck = await db.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
  if (parseInt(productCheck.rows[0].count) > 0) {
    await db.query('UPDATE categories SET is_active = false WHERE id = $1', [id]);
    return { deactivated: true };
  }
  const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) return null;
  return { deleted: true };
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
