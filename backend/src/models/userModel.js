const { query, pool } = require('../config/db');

const UserModel = {
  /** Find user by email (with password hash) */
  findByEmail: async (email) => {
    const res = await query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );
    return res.rows[0] || null;
  },

  /** Find user by ID (no password hash) */
  findById: async (id) => {
    const res = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              p.full_name, p.gender, p.birth_date,
              p.height_cm, p.weight_kg, p.preferred_unit
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  /** Create user + profile in a single transaction */
  create: async ({ name, email, passwordHash, fullName, gender, birthDate, heightCm, weightKg, preferredUnit }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'athlete')
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash]
      );
      const user = userRes.rows[0];

      await client.query(
        `INSERT INTO user_profiles
           (user_id, full_name, gender, birth_date, height_cm, weight_kg, preferred_unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, fullName || name, gender || null, birthDate || null,
         heightCm || null, weightKg || null, preferredUnit || 'metric']
      );

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_name, entity_id)
         VALUES ($1, 'REGISTER', 'users', $1)`,
        [user.id]
      );

      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /** Update user profile */
  updateProfile: async (userId, { name, fullName, gender, birthDate, heightCm, weightKg, preferredUnit }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (name) {
        await client.query(
          'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
          [name, userId]
        );
      }

      await client.query(
        `INSERT INTO user_profiles (user_id, full_name, gender, birth_date, height_cm, weight_kg, preferred_unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE
           SET full_name      = EXCLUDED.full_name,
               gender         = EXCLUDED.gender,
               birth_date     = EXCLUDED.birth_date,
               height_cm      = EXCLUDED.height_cm,
               weight_kg      = EXCLUDED.weight_kg,
               preferred_unit = EXCLUDED.preferred_unit,
               updated_at     = NOW()`,
        [userId, fullName, gender, birthDate, heightCm, weightKg, preferredUnit || 'metric']
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /** Update password hash */
  updatePassword: async (userId, newHash) => {
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );
  },

  /** Get training types */
  getTrainingTypes: async () => {
    const res = await query('SELECT * FROM training_types ORDER BY id');
    return res.rows;
  },

  /** Log audit action */
  audit: async (userId, action, entityName, entityId) => {
    await query(
      'INSERT INTO audit_logs (user_id, action, entity_name, entity_id) VALUES ($1,$2,$3,$4)',
      [userId, action, entityName, entityId]
    );
  },
};

module.exports = UserModel;