const fs = require('fs');
const path = require('path');
const db = require('./index');

async function runSeed() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await db.query(sql);
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error running seed:', err.message);
    process.exit(1);
  }
}

runSeed();
