const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.status(200).json({ user });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateMe(req.user._id, req.body);
  res.status(200).json({ user });
});

module.exports = { login, me, updateMe };
