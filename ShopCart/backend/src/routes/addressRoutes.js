const express = require('express');
const { getAddresses, getAddressById, createAddress, updateAddress, deleteAddress } = require('../controllers/addressController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { addressRules, updateAddressRules } = require('../validators/order');

const router = express.Router();

router.use(authenticate);

router.get('/', getAddresses);
router.get('/:id', getAddressById);
router.post('/', addressRules, validate, createAddress);
router.put('/:id', updateAddressRules, validate, updateAddress);
router.delete('/:id', deleteAddress);

module.exports = router;
