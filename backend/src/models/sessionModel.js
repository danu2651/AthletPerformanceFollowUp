const db = require("../config/db");

const Session = {
  async createWithSplits(data, splits) {
    // We use db directly if it's the Pool instance
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const {
        user_id,
        training_type_id,
        distance_km,
        duration_seconds,
        training_date,
        start_point,
        end_point,
        altitude,
        temperature,
        notes,
        avg_speed,
        avg_pace,
      } = data;

      const sessionQuery = `
        INSERT INTO training_sessions 
        (user_id, training_type_id, distance_km, duration_seconds, training_date, 
         start_point, end_point, altitude, temperature, notes, avg_speed, avg_pace, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *;
      `;

      const sessionValues = [
        user_id,
        training_type_id || 1,
        distance_km,
        duration_seconds,
        training_date || new Date(),
        start_point || null,
        end_point || null,
        altitude || null,
        temperature || null,
        notes || null,
        avg_speed,
        avg_pace,
      ];

      const { rows } = await client.query(sessionQuery, sessionValues);
      const newSession = rows[0];

      if (splits && Array.isArray(splits) && splits.length > 0) {
        const splitQuery = `
          INSERT INTO kilometer_splits (session_id, kilometer_number, split_time, split_speed)
          VALUES ($1, $2, $3, $4)
        `;
        for (const split of splits) {
          await client.query(splitQuery, [
            newSession.id,
            split.km,
            split.time,
            split.speed,
          ]);
        }
      }

      await client.query("COMMIT");
      return { ...newSession, splits: splits || [] };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error; // Let the controller catch this
    } finally {
      // CRITICAL: Always release the client back to the pool!
      client.release();
    }
  },

  // ... rest of your methods (getDeepAnalytics, getByUserId, delete)
  async getDeepAnalytics(userId) {
    const query = `
      SELECT 
        COUNT(*)::INT as total_sessions,
        COALESCE(SUM(distance_km), 0)::FLOAT as total_dist,
        COALESCE(AVG(avg_speed), 0)::FLOAT as avg_speed_all_time,
        COALESCE(MIN(avg_pace), 0)::FLOAT as best_pace,
        MAX(distance_km)::FLOAT as longest_run,
        COALESCE((SELECT SUM(distance_km) FROM training_sessions WHERE user_id = $1 AND training_date > NOW() - INTERVAL '7 days'), 0)::FLOAT as current_week_km,
        COALESCE((SELECT SUM(distance_km) FROM training_sessions WHERE user_id = $1 AND training_date BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'), 0)::FLOAT as last_week_km
      FROM training_sessions WHERE user_id = $1;
    `;
    const { rows } = await db.query(query, [userId]);
    return rows[0];
  },

  async getByUserId(userId) {
    const { rows } = await db.query(
      `SELECT * FROM training_sessions WHERE user_id = $1 ORDER BY training_date DESC`,
      [userId],
    );
    return rows;
  },

  async delete(id, userId) {
    const { rows } = await db.query(
      `DELETE FROM training_sessions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId],
    );
    return rows.length > 0;
  },
};

module.exports = Session;
