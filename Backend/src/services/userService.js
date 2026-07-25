const User = require('../models/User');
const AppError = require('../utils/AppError');

async function listUsers() {
  const users = await User.find().sort({ name: 1 });
  return users.map((u) => u.toSafeJSON());
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
}

async function createUser({ name, email, password, role = 'member' }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('A user with this email already exists', 400);
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
  });

  return user.toSafeJSON();
}

async function updateUser(id, payload) {
  const user = await getUserById(id);

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

  if (payload.role !== undefined && payload.role !== user.role) {
    if (user.role === 'admin' && payload.role === 'member') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new AppError('Cannot demote the last admin', 400);
      }
    }
    user.role = payload.role;
  }

  if (payload.password) {
    user.passwordHash = await User.hashPassword(payload.password);
  }

  await user.save();
  return user.toSafeJSON();
}

module.exports = { listUsers, getUserById, createUser, updateUser };
