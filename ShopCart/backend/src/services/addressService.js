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

  const sets = [];
  const params = [];
  let paramIndex = 1;

  if (label !== undefined) { sets.push(`label = $${paramIndex++}`); params.push(label); }
  if (address_line1 !== undefined) { sets.push(`address_line1 = $${paramIndex++}`); params.push(address_line1); }
  if (address_line2 !== undefined) { sets.push(`address_line2 = $${paramIndex++}`); params.push(address_line2); }
  if (city !== undefined) { sets.push(`city = $${paramIndex++}`); params.push(city); }
  if (state !== undefined) { sets.push(`state = $${paramIndex++}`); params.push(state); }
  if (postal_code !== undefined) { sets.push(`postal_code = $${paramIndex++}`); params.push(postal_code); }
  if (country !== undefined) { sets.push(`country = $${paramIndex++}`); params.push(country); }
  if (phone !== undefined) { sets.push(`phone = $${paramIndex++}`); params.push(phone); }
  if (is_default !== undefined) { sets.push(`is_default = $${paramIndex++}`); params.push(is_default); }

  if (sets.length === 0) {
    return getAddressById(userId, addressId);
  }

  params.push(addressId);
  params.push(userId);
  const result = await db.query(
    `UPDATE addresses SET ${sets.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING *`,
    params
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
