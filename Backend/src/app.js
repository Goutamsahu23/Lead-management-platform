const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { loadEnv } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const leadRoutes = require('./routes/leadRoutes');
const userRoutes = require('./routes/userRoutes');

function createApp() {
  const env = loadEnv();
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
    app.use(
      rateLimit({
        windowMs: env.rateLimitWindowMs,
        max: env.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many requests, please try again later' },
      })
    );
  }

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/users', userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
