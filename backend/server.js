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

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`=================================`);
});
