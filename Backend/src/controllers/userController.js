const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  res.status(200).json({ data: users });
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ data: user });
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ data: user });
});

module.exports = { list, create, update };
