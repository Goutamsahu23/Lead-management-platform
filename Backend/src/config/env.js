const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredInProduction = ['MONGODB_URI', 'JWT_SECRET'];

function loadEnv() {
  const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5000,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lead-platform',
    jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 200,
    publicRateLimitMax: Number(process.env.PUBLIC_RATE_LIMIT_MAX) || 30,
  };

  if (env.nodeEnv === 'production') {
    for (const key of requiredInProduction) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  }

  return env;
}

module.exports = { loadEnv };
