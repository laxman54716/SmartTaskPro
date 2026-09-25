const { body } = require('express-validator');

const registerRules = [
  body('first_name').trim().notEmpty().withMessage('First name is required')
    .isLength({ max: 100 }).withMessage('First name too long'),
  body('last_name').trim().notEmpty().withMessage('Last name is required')
    .isLength({ max: 100 }).withMessage('Last name too long'),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
