const { body } = require('express-validator');

const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required')
    .isLength({ max: 255 }).withMessage('Product name too long'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('discount_price').optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Discount price must be a non-negative number')
    .custom((val, { req }) => {
      if (val !== null && val !== undefined && val !== '' && req.body.price !== undefined) {
        if (parseFloat(val) > parseFloat(req.body.price)) {
          throw new Error('Discount price cannot be greater than original price');
        }
      }
      return true;
    }),
  body('category_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Invalid category'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('sku').trim().notEmpty().withMessage('SKU is required')
    .isLength({ max: 100 }).withMessage('SKU too long'),
];

const categoryRules = [
  body('name').trim().notEmpty().withMessage('Category name is required')
    .isLength({ max: 100 }).withMessage('Category name too long'),
];

const updateCategoryRules = [
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty')
    .isLength({ max: 100 }).withMessage('Category name too long'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

const updateProductRules = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty')
    .isLength({ max: 255 }).withMessage('Product name too long'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('discount_price').optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Discount price must be a non-negative number')
    .custom((val, { req }) => {
      if (val !== null && val !== undefined && val !== '' && req.body.price !== undefined) {
        if (parseFloat(val) > parseFloat(req.body.price)) {
          throw new Error('Discount price cannot be greater than original price');
        }
      }
      return true;
    }),
  body('category_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Invalid category'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty')
    .isLength({ max: 100 }).withMessage('SKU too long'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

module.exports = { productRules, updateProductRules, categoryRules, updateCategoryRules };
