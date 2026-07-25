const AppError = require('../utils/AppError');
const { loadEnv } = require('../config/env');

function errorHandler(err, req, res, next) {
  const { nodeEnv } = loadEnv();

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((e) => e.message);
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (!(err instanceof AppError) && statusCode === 500 && nodeEnv === 'production') {
    message = 'Internal server error';
    errors = undefined;
  }

  if (nodeEnv !== 'test' && statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    ...(errors ? { errors } : {}),
  });
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

module.exports = { errorHandler, notFoundHandler };
