const db = require('../db');

const getCart = async (userId) => {
  // Ensure cart exists
  let cart = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (cart.rows.length === 0) {
    cart = await db.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
  }
  const cartId = cart.rows[0].id;

  const items = await db.query(
    `SELECT ci.id, ci.quantity, ci.product_id,
            p.name, p.price, p.discount_price, p.image_url, p.stock_quantity, p.is_active
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at DESC`,
    [cartId]
  );

  let subtotal = 0;
  const cartItems = items.rows.map((item) => {
    const effectivePrice = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
    const itemSubtotal = effectivePrice * item.quantity;
    subtotal += itemSubtotal;
    return {
      id: item.id,
      product_id: item.product_id,
      name: item.name,
      price: parseFloat(item.price),
      discount_price: item.discount_price ? parseFloat(item.discount_price) : null,
      effective_price: effectivePrice,
      image_url: item.image_url,
      stock_quantity: item.stock_quantity,
      is_active: item.is_active,
      quantity: item.quantity,
      item_subtotal: parseFloat(itemSubtotal.toFixed(2)),
    };
  });

  const tax = parseFloat((subtotal * 0.08).toFixed(2)); // 8% tax
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const total = parseFloat((subtotal + tax + shipping).toFixed(2));

  return {
    cart_id: cartId,
    items: cartItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax,
    shipping,
    discount: 0,
    total,
    item_count: cartItems.length,
  };
};

const addItem = async (userId, { product_id, quantity }) => {
  // Validate product
  const product = await db.query(
    'SELECT id, stock_quantity, is_active FROM products WHERE id = $1',
    [product_id]
  );
  if (product.rows.length === 0) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }
  if (!product.rows[0].is_active) {
    throw Object.assign(new Error('Product is not available'), { statusCode: 400 });
  }
  if (product.rows[0].stock_quantity < quantity) {
    throw Object.assign(new Error(`Only ${product.rows[0].stock_quantity} items available in stock`), { statusCode: 400 });
  }

  // Ensure cart exists
  let cart = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (cart.rows.length === 0) {
    cart = await db.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
  }
  const cartId = cart.rows[0].id;

  // Check if product already in cart
  const existing = await db.query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cartId, product_id]
  );

  if (existing.rows.length > 0) {
    const newQty = existing.rows[0].quantity + quantity;
    if (newQty > product.rows[0].stock_quantity) {
      throw Object.assign(new Error(`Cannot add more. Only ${product.rows[0].stock_quantity} available (${existing.rows[0].quantity} already in cart)`), { statusCode: 400 });
    }
    await db.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [newQty, existing.rows[0].id]);
  } else {
    await db.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
      [cartId, product_id, quantity]
    );
  }

  return getCart(userId);
};

const updateItem = async (userId, itemId, { quantity }) => {
  const cart = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (cart.rows.length === 0) {
    throw Object.assign(new Error('Cart not found'), { statusCode: 404 });
  }

  const item = await db.query(
    `SELECT ci.id, ci.product_id, p.stock_quantity
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.id = $1 AND ci.cart_id = $2`,
    [itemId, cart.rows[0].id]
  );

  if (item.rows.length === 0) {
    throw Object.assign(new Error('Cart item not found'), { statusCode: 404 });
  }

  if (quantity > item.rows[0].stock_quantity) {
    throw Object.assign(new Error(`Only ${item.rows[0].stock_quantity} items available in stock`), { statusCode: 400 });
  }

  await db.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, itemId]);
  return getCart(userId);
};

const removeItem = async (userId, itemId) => {
  const cart = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (cart.rows.length === 0) {
    throw Object.assign(new Error('Cart not found'), { statusCode: 404 });
  }

  const result = await db.query(
    'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2 RETURNING id',
    [itemId, cart.rows[0].id]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Cart item not found'), { statusCode: 404 });
  }

  return getCart(userId);
};

const clearCart = async (userId) => {
  const cart = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (cart.rows.length === 0) return;
  await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id]);
  return getCart(userId);
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
