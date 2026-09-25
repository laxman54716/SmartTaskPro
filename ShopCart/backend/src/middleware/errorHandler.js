const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, _next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err.message, err.stack);
  } else {
    console.error('Error:', err.message);
  }

  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'Invalid JSON in request body', 400);
  }

  if (err.code === '23505') {
    return sendError(res, 'Duplicate entry. This record already exists.', 409);
  }

  if (err.code === '23503') {
    return sendError(res, 'Referenced record not found.', 400);
  }

  if (err.code === '23514') {
    return sendError(res, 'Invalid data. Check constraint violated.', 400);
  }

  return sendError(res, 'Internal server error', 500);
};

module.exports = errorHandler;
