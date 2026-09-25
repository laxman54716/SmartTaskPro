const express = require('express');
const { getDashboard, getCustomers, getAllOrders, updateOrderStatus, getAllProducts } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/customers', getCustomers);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/products', getAllProducts);

module.exports = router;
