const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'athelete_app',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max:                20,
  idleTimeoutMillis:  30000,
  connectionTimeoutMillis: 2000,
});

pool.connect((err, client, release) => {
  if (err) return console.error('❌  DB connection error:', err.message);
  console.log('✅  PostgreSQL connected');
  release();
});

const query = async (text, params) => {
  const res = await pool.query(text, params);
  return res;
};

module.exports = { pool, query };