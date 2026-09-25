const db = require('../db');

const getDashboard = async () => {
  const [users, products, orders, revenue, pending, delivered, lowStock] = await Promise.all([
    db.query("SELECT COUNT(*) FROM users WHERE role = 'customer'"),
    db.query('SELECT COUNT(*) FROM products WHERE is_active = true'),
    db.query('SELECT COUNT(*) FROM orders'),
    db.query("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status = 'paid'"),
    db.query("SELECT COUNT(*) FROM orders WHERE order_status = 'placed' OR order_status = 'confirmed'"),
    db.query("SELECT COUNT(*) FROM orders WHERE order_status = 'delivered'"),
    db.query('SELECT id, name, stock_quantity, sku FROM products WHERE stock_quantity < 10 AND is_active = true ORDER BY stock_quantity ASC LIMIT 10'),
  ]);

  // Recent orders
  const recentOrders = await db.query(
    `SELECT o.id, o.order_number, o.total, o.order_status, o.created_at, u.first_name, u.last_name
     FROM orders o JOIN users u ON o.user_id = u.id
     ORDER BY o.created_at DESC LIMIT 5`
  );

  return {
    total_customers: parseInt(users.rows[0].count),
    total_products: parseInt(products.rows[0].count),
    total_orders: parseInt(orders.rows[0].count),
    total_revenue: parseFloat(revenue.rows[0].total),
    pending_orders: parseInt(pending.rows[0].count),
    delivered_orders: parseInt(delivered.rows[0].count),
    low_stock_products: lowStock.rows,
    recent_orders: recentOrders.rows,
  };
};

const getCustomers = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const countResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'customer'");
  const total = parseInt(countResult.rows[0].count);

  const result = await db.query(
    `SELECT id, first_name, last_name, email, phone, created_at FROM users
     WHERE role = 'customer' ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { customers: result.rows, page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) };
};

module.exports = { getDashboard, getCustomers };
