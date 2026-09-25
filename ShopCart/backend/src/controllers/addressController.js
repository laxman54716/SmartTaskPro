const addressService = require('../services/addressService');
const { sendSuccess, sendError } = require('../utils/response');

const getAddresses = async (req, res, next) => {
  try {
    const data = await addressService.getAddresses(req.user.id);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const getAddressById = async (req, res, next) => {
  try {
    const data = await addressService.getAddressById(req.user.id, req.params.id);
    if (!data) return sendError(res, 'Address not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const data = await addressService.createAddress(req.user.id, req.body);
    sendSuccess(res, data, 201);
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const data = await addressService.updateAddress(req.user.id, req.params.id, req.body);
    if (!data) return sendError(res, 'Address not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const deleted = await addressService.deleteAddress(req.user.id, req.params.id);
    if (!deleted) return sendError(res, 'Address not found', 404);
    sendSuccess(res, { message: 'Address deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAddresses, getAddressById, createAddress, updateAddress, deleteAddress };
