const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate, authorize('admin'));
router.get('/', userController.list);
router.post('/', validate(createUserSchema), userController.create);
router.patch('/:id', validate(updateUserSchema), userController.update);

module.exports = router;
