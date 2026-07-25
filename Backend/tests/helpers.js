const User = require('../src/models/User');
const { signToken } = require('../src/services/authService');

async function createUser({
  name = 'Test User',
  email,
  password = 'Password123!',
  role = 'member',
}) {
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
  });
  return user;
}

async function authHeaderFor(user) {
  const token = signToken(user);
  return `Bearer ${token}`;
}

module.exports = { createUser, authHeaderFor };
