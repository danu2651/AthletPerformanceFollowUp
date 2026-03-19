const { Pool } = require("pg");
require("dotenv").config();

/**
 * Configure the Connection Pool
 * Using individual variables (DB_USER, DB_HOST, etc.) is more flexible
 * for local development and professional environments.
 */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Optional: If you prefer using a single connection string:
  // connectionString: process.env.DATABASE_URL,
});

// Verification Log
pool.on("connect", () => {
  console.log("✅ Connected to the PostgreSQL database");
});

// Error handling for idle clients
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

/**
 * CRITICAL FIX: Export the entire pool object.
 * This allows the models to use:
 * 1. db.query() for simple requests
 * 2. db.connect() for complex Transactions (Needed for Splits)
 */
module.exports = pool;
