const cartService = require('../services/cartService');
const { sendSuccess, sendError } = require('../utils/response');

const getCart = async (req, res, next) => {
  try {
    const data = await cartService.getCart(req.user.id);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const data = await cartService.addItem(req.user.id, req.body);
    sendSuccess(res, data, 201);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const data = await cartService.updateItem(req.user.id, req.params.id, req.body);
    sendSuccess(res, data);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const data = await cartService.removeItem(req.user.id, req.params.id);
    sendSuccess(res, data);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user.id);
    sendSuccess(res, { message: 'Cart cleared successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
