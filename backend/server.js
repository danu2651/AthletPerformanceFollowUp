 HEAD
const app = require("./src/app");
const db = require("./src/config/db"); 
require("dotenv").config();

const PORT = process.env.PORT || 5000;


db.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
  } else {
    console.log("✅ Connected to the PostgreSQL database");
  }
});


require('dotenv').config();
const app  = require('./src/app');

const PORT = process.env.PORT || 5000;

 
app.listen(PORT, () => {
  console.log(`\n🚀  APTS API running → http://localhost:${PORT}`);
  console.log(`📦  Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️   Database    : ${process.env.DB_NAME}\n`);
});