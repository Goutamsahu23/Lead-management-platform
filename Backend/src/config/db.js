const mongoose = require('mongoose');
const { loadEnv } = require('./env');

async function connectDb(uri) {
  const { mongodbUri } = loadEnv();
  const connectionUri = uri || mongodbUri;

  mongoose.set('strictQuery', true);
  await mongoose.connect(connectionUri);
  return mongoose.connection;
}

async function disconnectDb() {
  await mongoose.disconnect();
}

module.exports = { connectDb, disconnectDb };
