const express = require('express');
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { cartItemRules, updateCartItemRules } = require('../validators/cart');

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/items', cartItemRules, validate, addItem);
router.put('/items/:id', updateCartItemRules, validate, updateItem);
router.delete('/items/:id', removeItem);
router.delete('/', clearCart);

module.exports = router;
