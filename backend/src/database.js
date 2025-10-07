const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const url = process.env.DATABASE_URL;

// Helpful diagnostics
if (!url) {
  console.error('❌ Missing DATABASE_URL. Check backend/.env');
  console.error('Where I looked for .env:', path.resolve(__dirname, '../.env'));
  process.exit(1);
}
console.log('DATABASE_URL =', process.env.DATABASE_URL);

const pool = new Pool({ connectionString: url });

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ Database connection error:', err.message));

module.exports = pool;
