const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDb, disconnectDb } = require('../src/config/db');
const User = require('../src/models/User');

const DEMO_USERS = [
  {
    name: 'Admin User',
    email: 'admin@leadplatform.com',
    password: 'Admin123!',
    role: 'admin',
  },
  {
    name: 'Member User',
    email: 'member@leadplatform.com',
    password: 'Member123!',
    role: 'member',
  },
];

async function seed() {
  await connectDb();

  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email });
    const passwordHash = await User.hashPassword(demo.password);

    if (existing) {
      existing.name = demo.name;
      existing.role = demo.role;
      existing.passwordHash = passwordHash;
      await existing.save();
      console.log(`Updated ${demo.role}: ${demo.email}`);
    } else {
      await User.create({
        name: demo.name,
        email: demo.email,
        role: demo.role,
        passwordHash,
      });
      console.log(`Created ${demo.role}: ${demo.email}`);
    }
  }

  await disconnectDb();
  console.log('Seed complete');
}

seed().catch(async (err) => {
  console.error(err);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
