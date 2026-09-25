const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Cloud PostgreSQL providers (Neon, etc.) require SSL
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
