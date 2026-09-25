const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

const sendError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};

const sendPaginated = (res, data, pagination) => {
  res.status(200).json({
    success: true,
    data,
    ...pagination,
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
