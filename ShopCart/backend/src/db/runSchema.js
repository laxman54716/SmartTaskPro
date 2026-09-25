const fs = require('fs');
const path = require('path');
const db = require('./index');

async function runSchema() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await db.query(sql);
    console.log('Schema created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error running schema:', err.message);
    process.exit(1);
  }
}

runSchema();
