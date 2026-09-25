const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const db = require('../db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const result = await db.query(
      'SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'User not found', 401);
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', 401);
    }
    return sendError(res, 'Authentication failed', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'Access denied', 403);
    }
    next();
  };
};

module.exports = { authenticate, authorize };
