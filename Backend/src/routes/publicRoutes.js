const express = require('express');
const rateLimit = require('express-rate-limit');
const leadController = require('../controllers/leadController');
const { validate } = require('../middleware/validate');
const { publicLeadSchema } = require('../validators/schemas');
const { loadEnv } = require('../config/env');

const router = express.Router();
const env = loadEnv();

const publicLimiter =
  env.nodeEnv === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: env.rateLimitWindowMs,
        max: env.publicRateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many submissions, please try again later' },
      });

router.post('/leads', publicLimiter, validate(publicLeadSchema), leadController.createPublic);

module.exports = router;
