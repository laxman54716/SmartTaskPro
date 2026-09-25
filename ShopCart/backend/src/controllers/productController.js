const productService = require('../services/productService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const getProducts = async (req, res, next) => {
  try {
    const data = await productService.getProducts(req.query);
    const { products, ...pagination } = data;
    sendPaginated(res, products, pagination);
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const data = await productService.getProductById(req.params.id);
    if (!data) return sendError(res, 'Product not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

// Admin only
const createProduct = async (req, res, next) => {
  try {
    const data = await productService.createProduct(req.body);
    sendSuccess(res, data, 201);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const data = await productService.updateProduct(req.params.id, req.body);
    if (!data) return sendError(res, 'Product not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const data = await productService.deleteProduct(req.params.id);
    if (!data) return sendError(res, 'Product not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
