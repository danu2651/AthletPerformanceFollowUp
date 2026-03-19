const app = require("./src/app");
const db = require("./src/config/db"); // This line triggers the connection message
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// Test DB Connection immediately on startup
db.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
  } else {
    console.log("✅ Connected to the PostgreSQL database");
  }
});

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`=================================`);
});
