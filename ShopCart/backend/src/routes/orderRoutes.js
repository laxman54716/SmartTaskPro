const express = require('express');
const { createOrder, getOrders, getOrderById, cancelOrder } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { orderRules } = require('../validators/order');

const router = express.Router();

router.use(authenticate);

router.post('/', orderRules, validate, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
