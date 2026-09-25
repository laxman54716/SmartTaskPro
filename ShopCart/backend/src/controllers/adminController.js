const adminService = require('../services/adminService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const data = await adminService.getCustomers(req.query);
    const { customers, ...pagination } = data;
    sendPaginated(res, customers, pagination);
  } catch (err) {
    next(err);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const data = await orderService.getAllOrders(req.query);
    const { orders, ...pagination } = data;
    sendPaginated(res, orders, pagination);
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const data = await orderService.updateOrderStatus(req.params.id, req.body);
    sendSuccess(res, data);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const data = await productService.getAllProductsAdmin(req.query);
    const { products, ...pagination } = data;
    sendPaginated(res, products, pagination);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getCustomers, getAllOrders, updateOrderStatus, getAllProducts };
