const { body } = require('express-validator');

const addressRules = [
  body('address_line1').trim().notEmpty().withMessage('Address line 1 is required')
    .isLength({ max: 255 }).withMessage('Address line 1 too long'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('postal_code').trim().notEmpty().withMessage('Postal code is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
];

const orderRules = [
  body('address_id').isInt({ min: 1 }).withMessage('Shipping address is required'),
  body('payment_method').isIn(['cod', 'card']).withMessage('Payment method must be cod or card'),
];

module.exports = { addressRules, orderRules };
