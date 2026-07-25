const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { loadEnv } = require('../config/env');

function signToken(user) {
  const { jwtSecret, jwtExpiresIn } = loadEnv();
  return jwt.sign({ role: user.role }, jwtSecret, {
    subject: user._id.toString(),
    expiresIn: jwtExpiresIn,
  });
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user);
  return { token, user: user.toSafeJSON() };
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user.toSafeJSON();
}

async function updateMe(userId, payload) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (payload.password) {
    if (!payload.currentPassword) {
      throw new AppError('Current password is required to set a new password', 400);
    }
    const valid = await user.comparePassword(payload.currentPassword);
    if (!valid) {
      throw new AppError('Current password is incorrect', 400);
    }
    user.passwordHash = await User.hashPassword(payload.password);
  }

  if (payload.email && payload.email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: payload.email.toLowerCase() });
    if (existing) {
      throw new AppError('A user with this email already exists', 400);
    }
    user.email = payload.email.toLowerCase();
  }

  if (payload.name !== undefined) {
    user.name = payload.name;
  }

  await user.save();
  return user.toSafeJSON();
}

module.exports = { login, getMe, updateMe, signToken };
