const categoryService = require('../services/categoryService');
const { sendSuccess, sendError } = require('../utils/response');

const getCategories = async (req, res, next) => {
  try {
    const includeInactive = req.user && req.user.role === 'admin';
    const data = await categoryService.getCategories(includeInactive);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const data = await categoryService.getCategoryById(req.params.id);
    if (!data) return sendError(res, 'Category not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const data = await categoryService.createCategory(req.body);
    sendSuccess(res, data, 201);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const data = await categoryService.updateCategory(req.params.id, req.body);
    if (!data) return sendError(res, 'Category not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const data = await categoryService.deleteCategory(req.params.id);
    if (!data) return sendError(res, 'Category not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
