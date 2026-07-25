const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { loadEnv } = require('../config/env');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = header.slice(7);
  const { jwtSecret } = loadEnv();

  let decoded;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (err) {
    throw err;
  }

  const user = await User.findById(decoded.sub).select('-passwordHash');
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
