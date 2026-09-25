const orderService = require('../services/orderService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const createOrder = async (req, res, next) => {
  try {
    const data = await orderService.createOrder(req.user.id, req.body);
    sendSuccess(res, data, 201);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const data = await orderService.getOrders(req.user.id, req.query);
    const { orders, ...pagination } = data;
    sendPaginated(res, orders, pagination);
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const data = await orderService.getOrderById(req.user.id, req.params.id, isAdmin);
    if (!data) return sendError(res, 'Order not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const data = await orderService.cancelOrder(req.user.id, req.params.id);
    sendSuccess(res, data);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

module.exports = { createOrder, getOrders, getOrderById, cancelOrder };
