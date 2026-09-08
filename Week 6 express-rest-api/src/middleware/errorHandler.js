const ApiError = require('../utils/ApiError');


const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

const errorHandler = (err, req, res, next) => {
  let { statusCode, message, details } = err;

  const isOperational = err.isOperational === true;
  if (!isOperational) {
    console.error('[UNHANDLED ERROR]', err);
    statusCode = 500;
    message = 'Internal server error';
    details = null;
  }

  statusCode = statusCode || 500;

  const body = {
    success: false,
    error: {
      statusCode,
      message: message || 'Internal server error',
      requestId: req.requestId,
      ...(details ? { details } : {}),
    },
  };

  if (process.env.NODE_ENV === 'development' && !isOperational) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = { notFoundHandler, errorHandler };
