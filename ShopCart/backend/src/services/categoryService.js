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
  const result = await db.query(
    `UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), is_active = COALESCE($3, is_active)
     WHERE id = $4 RETURNING *`,
    [name, description, is_active, id]
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
