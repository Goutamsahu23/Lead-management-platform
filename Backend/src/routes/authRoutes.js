const express = require('express');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { loginSchema, updateProfileSchema } = require('../validators/schemas');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(updateProfileSchema), authController.updateMe);

module.exports = router;
