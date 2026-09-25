const { body } = require('express-validator');

const cartItemRules = [
  body('product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const updateCartItemRules = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

module.exports = { cartItemRules, updateCartItemRules };
