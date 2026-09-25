const express = require('express');
const { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { categoryRules } = require('../validators/product'); // using product validators for now or we can split

const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin only routes
router.use(authenticate, authorize('admin'));
router.post('/', categoryRules, validate, createCategory);
router.put('/:id', categoryRules, validate, updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
