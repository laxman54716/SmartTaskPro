const db = require('../db');
const crypto = require('crypto');

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SC-${timestamp}-${random}`;
};

const createOrder = async (userId, { address_id, payment_method, notes }) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Get and validate cart
    const cartResult = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    if (cartResult.rows.length === 0) {
      throw Object.assign(new Error('Cart not found'), { statusCode: 404 });
    }
    const cartId = cartResult.rows[0].id;

    const cartItems = await client.query(
      `SELECT ci.id, ci.quantity, ci.product_id,
              p.name, p.price, p.discount_price, p.image_url, p.stock_quantity, p.is_active
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1
       ORDER BY ci.product_id ASC
       FOR UPDATE OF p`,
      [cartId]
    );

    if (cartItems.rows.length === 0) {
      throw Object.assign(new Error('Cart is empty'), { statusCode: 400 });
    }

    // 2. Validate stock for all items
    for (const item of cartItems.rows) {
      if (!item.is_active) {
        throw Object.assign(new Error(`Product "${item.name}" is no longer available`), { statusCode: 400 });
      }
      if (item.stock_quantity < item.quantity) {
        throw Object.assign(new Error(`Insufficient stock for "${item.name}". Only ${item.stock_quantity} available`), { statusCode: 400 });
      }
    }

    // 3. Validate address belongs to user
    const addressResult = await client.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [address_id, userId]
    );
    if (addressResult.rows.length === 0) {
      throw Object.assign(new Error('Shipping address not found'), { statusCode: 404 });
    }
    const address = addressResult.rows[0];

    // 4. Calculate totals server-side
    let subtotal = 0;
    const orderItemsData = cartItems.rows.map((item) => {
      const unitPrice = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      return {
        product_id: item.product_id,
        product_name: item.name,
        product_image: item.image_url,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: parseFloat(itemSubtotal.toFixed(2)),
      };
    });

    subtotal = parseFloat(subtotal.toFixed(2));
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const shipping = subtotal > 50 ? 0 : 5.99;
    const discount = 0;
    const total = parseFloat((subtotal + tax + shipping - discount).toFixed(2));

    // 5. Mock payment
    let paymentStatus = 'pending';
    if (payment_method === 'cod') {
      paymentStatus = 'pending';
    } else if (payment_method === 'card') {
      // Simulate card payment (90% success rate)
      paymentStatus = Math.random() < 0.9 ? 'paid' : 'failed';
    }

    if (paymentStatus === 'failed') {
      await client.query('ROLLBACK');
      throw Object.assign(new Error('Payment failed. Please try again.'), { statusCode: 402 });
    }

    // 6. Create order
    const orderNumber = generateOrderNumber();
    const shippingAddress = {
      label: address.label,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone,
    };

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, order_number, subtotal, tax, shipping_fee, discount, total, shipping_address, payment_method, payment_status, order_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'placed')
       RETURNING *`,
      [userId, orderNumber, subtotal, tax, shipping, discount, total, JSON.stringify(shippingAddress), payment_method, paymentStatus]
    );
    const order = orderResult.rows[0];

    // 7. Create order items
    for (const item of orderItemsData) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.product_id, item.product_name, item.product_image, item.quantity, item.unit_price, item.subtotal]
      );
    }

    // 8. Reduce stock (atomic update with check)
    for (const item of cartItems.rows) {
      const updateResult = await client.query(
        `UPDATE products SET stock_quantity = stock_quantity - $1
         WHERE id = $2 AND stock_quantity >= $1
         RETURNING stock_quantity`,
        [item.quantity, item.product_id]
      );
      if (updateResult.rows.length === 0) {
        throw Object.assign(new Error(`Concurrent stock conflict for "${item.name}"`), { statusCode: 409 });
      }
    }

    // 9. Clear cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');

    return { ...order, items: orderItemsData };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getOrders = async (userId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const countResult = await db.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]);
  const total = parseInt(countResult.rows[0].count);

  const result = await db.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return {
    orders: result.rows,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

const getOrderById = async (userId, orderId, isAdmin = false) => {
  let query = 'SELECT * FROM orders WHERE id = $1';
  const params = [orderId];

  if (!isAdmin) {
    query += ' AND user_id = $2';
    params.push(userId);
  }

  const orderResult = await db.query(query, params);
  if (orderResult.rows.length === 0) return null;

  const order = orderResult.rows[0];
  const itemsResult = await db.query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
    [orderId]
  );

  return { ...order, items: itemsResult.rows };
};

const cancelOrder = async (userId, orderId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    }

    const order = orderResult.rows[0];
    if (!['placed', 'confirmed'].includes(order.order_status)) {
      throw Object.assign(new Error('Order cannot be cancelled at this stage'), { statusCode: 400 });
    }

    // Restore stock
    const items = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
    for (const item of items.rows) {
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    const updated = await client.query(
      `UPDATE orders SET order_status = 'cancelled', payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE payment_status END
       WHERE id = $1 RETURNING *`,
      [orderId]
    );

    await client.query('COMMIT');
    return updated.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Admin functions
const getAllOrders = async ({ page = 1, limit = 20, status, search }) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`o.order_status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (search) {
    conditions.push(`(o.order_number ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit);
  params.push(offset);

  const result = await db.query(
    `SELECT o.*, u.first_name, u.last_name, u.email as customer_email
     FROM orders o
     JOIN users u ON o.user_id = u.id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return { orders: result.rows, page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) };
};

const updateOrderStatus = async (orderId, { order_status, payment_status }) => {
  const sets = [];
  const params = [];
  let paramIndex = 1;

  if (order_status) {
    sets.push(`order_status = $${paramIndex}`);
    params.push(order_status);
    paramIndex++;
  }
  if (payment_status) {
    sets.push(`payment_status = $${paramIndex}`);
    params.push(payment_status);
    paramIndex++;
  }

  if (sets.length === 0) {
    throw Object.assign(new Error('No fields to update'), { statusCode: 400 });
  }

  params.push(orderId);
  const result = await db.query(
    `UPDATE orders SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }
  return result.rows[0];
};

module.exports = { createOrder, getOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
