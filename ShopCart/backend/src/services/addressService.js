const db = require('../db');

const getAddresses = async (userId) => {
  const result = await db.query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return result.rows;
};

const getAddressById = async (userId, addressId) => {
  const result = await db.query(
    'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
    [addressId, userId]
  );
  return result.rows[0] || null;
};

const createAddress = async (userId, data) => {
  const { label, address_line1, address_line2, city, state, postal_code, country, phone, is_default } = data;

  if (is_default) {
    await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
  }

  const result = await db.query(
    `INSERT INTO addresses (user_id, label, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [userId, label || 'Home', address_line1, address_line2, city, state, postal_code, country || 'India', phone, is_default || false]
  );
  return result.rows[0];
};

const updateAddress = async (userId, addressId, data) => {
  const { label, address_line1, address_line2, city, state, postal_code, country, phone, is_default } = data;

  if (is_default) {
    await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
  }

  const result = await db.query(
    `UPDATE addresses SET
       label = COALESCE($1, label),
       address_line1 = COALESCE($2, address_line1),
       address_line2 = $3,
       city = COALESCE($4, city),
       state = COALESCE($5, state),
       postal_code = COALESCE($6, postal_code),
       country = COALESCE($7, country),
       phone = COALESCE($8, phone),
       is_default = COALESCE($9, is_default)
     WHERE id = $10 AND user_id = $11
     RETURNING *`,
    [label, address_line1, address_line2, city, state, postal_code, country, phone, is_default, addressId, userId]
  );
  return result.rows[0] || null;
};

const deleteAddress = async (userId, addressId) => {
  const result = await db.query(
    'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
    [addressId, userId]
  );
  return result.rows.length > 0;
};

module.exports = { getAddresses, getAddressById, createAddress, updateAddress, deleteAddress };
