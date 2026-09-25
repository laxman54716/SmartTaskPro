const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    sendSuccess(res, data, 201);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    sendSuccess(res, data);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const data = await authService.getProfile(req.user.id);
    if (!data) return sendError(res, 'User not found', 404);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await authService.updateProfile(req.user.id, req.body);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
