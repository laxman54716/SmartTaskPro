// Setup script: creates the shopcart database and user, then runs schema + seed
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const ADMIN_URL = process.env.PG_ADMIN_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

async function setup() {
  const adminPool = new Pool({ connectionString: ADMIN_URL });

  try {
    // Try to create user (ignore if exists)
    try {
      await adminPool.query(`CREATE USER shopcart_user WITH PASSWORD 'shopcart_pass'`);
      console.log('Created user shopcart_user');
    } catch (e) {
      if (e.code === '42710') console.log('User shopcart_user already exists');
      else throw e;
    }

    // Drop and recreate database
    // First disconnect any existing connections
    await adminPool.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = 'shopcart' AND pid <> pg_backend_pid()
    `).catch(() => {});

    try {
      await adminPool.query('DROP DATABASE IF EXISTS shopcart');
      console.log('Dropped old shopcart database');
    } catch (e) {
      console.log('Could not drop database:', e.message);
    }

    await adminPool.query('CREATE DATABASE shopcart OWNER shopcart_user');
    console.log('Created database shopcart');
    
    await adminPool.query('GRANT ALL PRIVILEGES ON DATABASE shopcart TO shopcart_user');
    console.log('Granted privileges');

  } catch (e) {
    console.error('Admin setup error:', e.message);
    console.log('\nTrying with alternate passwords...');
    
    // If default "postgres" password doesn't work, try without password
    const altPool = new Pool({ connectionString: 'postgresql://postgres@localhost:5432/postgres' });
    try {
      try { await altPool.query(`CREATE USER shopcart_user WITH PASSWORD 'shopcart_pass'`); } catch (e2) { /* ignore */ }
      await altPool.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'shopcart' AND pid <> pg_backend_pid()`).catch(() => {});
      try { await altPool.query('DROP DATABASE IF EXISTS shopcart'); } catch (e2) { /* ignore */ }
      await altPool.query('CREATE DATABASE shopcart OWNER shopcart_user');
      await altPool.query('GRANT ALL PRIVILEGES ON DATABASE shopcart TO shopcart_user');
      console.log('Created database with alternate credentials');
      await altPool.end();
    } catch (e2) {
      console.error('Alt setup also failed:', e2.message);
      console.log('\n=== MANUAL SETUP REQUIRED ===');
      console.log('Run these commands in your PostgreSQL admin tool:');
      console.log("  CREATE USER shopcart_user WITH PASSWORD 'shopcart_pass';");
      console.log('  CREATE DATABASE shopcart OWNER shopcart_user;');
      console.log('  GRANT ALL PRIVILEGES ON DATABASE shopcart TO shopcart_user;');
      await altPool.end();
      process.exit(1);
    }
  } finally {
    await adminPool.end();
  }

  // Now connect to shopcart DB and run schema + seed
  const appPool = new Pool({ connectionString: 'postgresql://shopcart_user:shopcart_pass@localhost:5432/shopcart' });
  
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await appPool.query(schema);
    console.log('Schema created successfully');
    
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await appPool.query(seed);
    console.log('Database seeded successfully');
  } catch (e) {
    console.error('Schema/seed error:', e.message);
    process.exit(1);
  } finally {
    await appPool.end();
  }
  
  console.log('\n✓ Database setup complete!');
  console.log('  DB: shopcart');
  console.log('  User: shopcart_user');
  console.log('  Password: shopcart_pass');
}

setup();
