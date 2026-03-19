const db = require("../config/db");

const User = {
  async create(name, email, passwordHash) {
    // We MUST use 'password_hash' and 'name' to match your DB columns exactly
    const query = `
            INSERT INTO users (name, email, password_hash, role) 
            VALUES ($1, $2, $3, 'athlete')
            RETURNING id, name, email;
        `;
    const values = [name, email, passwordHash];

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      // This will show the exact SQL error in your terminal
      console.error("DATABASE ERROR:", error.message);
      throw error;
    }
  },

  async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const { rows } = await db.query(query, [email]);
    return rows[0];
  },
};

module.exports = User;
