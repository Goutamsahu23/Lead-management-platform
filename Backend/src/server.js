const { createApp } = require('./app');
const { connectDb } = require('./config/db');
const { loadEnv } = require('./config/env');

async function start() {
  const env = loadEnv();
  await connectDb();
  const app = createApp();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
