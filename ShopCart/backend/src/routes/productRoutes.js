const express = require('express');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { productRules, updateProductRules } = require('../validators/product');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only routes
router.use(authenticate, authorize('admin'));
router.post('/', productRules, validate, createProduct);
router.put('/:id', updateProductRules, validate, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
