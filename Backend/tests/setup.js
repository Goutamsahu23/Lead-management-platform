const mongoose = require('mongoose');
const { connectDb, disconnectDb } = require('../src/config/db');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.CORS_ORIGIN = 'http://localhost:3000';

  const localUri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/lead-platform-test';
  await connectDb(localUri);
  await mongoose.connection.db.admin().command({ ping: 1 });
}, 30000);

afterAll(async () => {
  await disconnectDb();
}, 30000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}, 30000);
