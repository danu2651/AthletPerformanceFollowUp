const { query, pool } = require('../config/db');

const SessionModel = {
  /** Paginated list of sessions for a user */
  findAll: async (userId, { page = 1, limit = 10, fromDate, toDate, trainingTypeId }) => {
    const offset = (page - 1) * limit;
    const filters = ['ts.user_id = $1'];
    const params  = [userId];
    let   pi = 2;

    if (fromDate) { filters.push(`ts.training_date >= $${pi++}`); params.push(fromDate); }
    if (toDate)   { filters.push(`ts.training_date <= $${pi++}`); params.push(toDate);   }
    if (trainingTypeId) { filters.push(`ts.training_type_id = $${pi++}`); params.push(trainingTypeId); }

    const where = filters.join(' AND ');

    const countRes = await query(
      `SELECT COUNT(*) FROM training_sessions ts WHERE ${where}`, params
    );
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await query(
      `SELECT ts.*, tt.name AS training_type_name,
              pm.avg_speed_kmh, pm.avg_pace_seconds, pm.calories_burned, pm.vo2_estimate
       FROM training_sessions ts
       LEFT JOIN training_types tt      ON tt.id = ts.training_type_id
       LEFT JOIN performance_metrics pm ON pm.session_id = ts.id
       WHERE ${where}
       ORDER BY ts.training_date DESC, ts.created_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset]
    );

    return { total, rows: dataRes.rows };
  },

  /** Single session with splits + route */
  findById: async (sessionId, userId) => {
    const sessionRes = await query(
      `SELECT ts.*, tt.name AS training_type_name,
              pm.avg_speed_kmh, pm.avg_pace_seconds, pm.calories_burned, pm.vo2_estimate
       FROM training_sessions ts
       LEFT JOIN training_types tt      ON tt.id = ts.training_type_id
       LEFT JOIN performance_metrics pm ON pm.session_id = ts.id
       WHERE ts.id = $1 AND ts.user_id = $2`,
      [sessionId, userId]
    );
    if (!sessionRes.rows.length) return null;

    const session = sessionRes.rows[0];

    const splits = await query(
      `SELECT kilometer_number, split_seconds,
              ROUND(split_seconds / 60.0, 2) AS split_minutes
       FROM kilometer_splits WHERE session_id = $1 ORDER BY kilometer_number`,
      [sessionId]
    );

    const route = await query(
      `SELECT latitude, longitude, altitude, recorded_at
       FROM session_routes WHERE session_id = $1 ORDER BY recorded_at`,
      [sessionId]
    );

    return { ...session, kilometer_splits: splits.rows, route_points: route.rows };
  },

  /** Create session with splits, route, metrics (transaction) */
  create: async (userId, data, metrics) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        training_type_id, start_point, end_point,
        distance_km, duration_seconds, temperature_c,
        training_date, notes, altitude,
        start_lat, start_lng, end_lat, end_lng,
        kilometer_splits = [], route_points = [],
      } = data;

      // Optionally store start/end GPS as locations
      let start_location_id = null, end_location_id = null;
      if (start_lat && start_lng) {
        const r = await client.query(
          `INSERT INTO locations (name, latitude, longitude) VALUES ($1,$2,$3) RETURNING id`,
          [start_point || 'Start', start_lat, start_lng]
        );
        start_location_id = r.rows[0].id;
      }
      if (end_lat && end_lng) {
        const r = await client.query(
          `INSERT INTO locations (name, latitude, longitude) VALUES ($1,$2,$3) RETURNING id`,
          [end_point || 'End', end_lat, end_lng]
        );
        end_location_id = r.rows[0].id;
      }

      const sessRes = await client.query(
        `INSERT INTO training_sessions
           (user_id, training_type_id, start_location_id, end_location_id,
            distance_km, duration_seconds, temperature_c, training_date, notes,
            start_point, end_point, altitude, avg_speed, avg_pace)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [userId, training_type_id, start_location_id, end_location_id,
         distance_km, duration_seconds, temperature_c, training_date, notes,
         start_point, end_point, altitude, metrics.avg_speed, metrics.avg_pace]
      );
      const session = sessRes.rows[0];

      // Kilometer splits
      for (const s of kilometer_splits) {
        await client.query(
          `INSERT INTO kilometer_splits (session_id, kilometer_number, split_seconds)
           VALUES ($1,$2,$3)
           ON CONFLICT (session_id, kilometer_number) DO UPDATE SET split_seconds = EXCLUDED.split_seconds`,
          [session.id, s.kilometer_number, s.split_seconds]
        );
      }

      // Route GPS points
      for (const p of route_points) {
        await client.query(
          `INSERT INTO session_routes (session_id, latitude, longitude, altitude, recorded_at)
           VALUES ($1,$2,$3,$4,$5)`,
          [session.id, p.latitude, p.longitude, p.altitude || null,
           p.recorded_at || new Date().toISOString()]
        );
      }

      // Performance metrics
      await client.query(
        `INSERT INTO performance_metrics
           (session_id, avg_speed_kmh, avg_pace_seconds, calories_burned)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (session_id) DO UPDATE
           SET avg_speed_kmh    = EXCLUDED.avg_speed_kmh,
               avg_pace_seconds = EXCLUDED.avg_pace_seconds,
               calories_burned  = EXCLUDED.calories_burned`,
        [session.id, metrics.avg_speed, metrics.avg_pace, metrics.calories_burned]
      );

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_name, entity_id)
         VALUES ($1,'CREATE','training_sessions',$2)`,
        [userId, session.id]
      );

      await SessionModel._refreshWeekly(client, userId, training_date);
      await client.query('COMMIT');
      return session;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /** Update session */
  update: async (sessionId, userId, data, metrics) => {
    const client = await pool.connect();
    try {
      const check = await client.query(
        'SELECT id, training_date FROM training_sessions WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );
      if (!check.rows.length) return null;

      await client.query('BEGIN');

      const { training_type_id, start_point, end_point, distance_km, duration_seconds,
              temperature_c, training_date, notes, altitude, kilometer_splits = [] } = data;

      const sessRes = await client.query(
        `UPDATE training_sessions SET
           training_type_id = COALESCE($1, training_type_id),
           start_point      = COALESCE($2, start_point),
           end_point        = COALESCE($3, end_point),
           distance_km      = COALESCE($4, distance_km),
           duration_seconds = COALESCE($5, duration_seconds),
           temperature_c    = COALESCE($6, temperature_c),
           training_date    = COALESCE($7, training_date),
           notes            = COALESCE($8, notes),
           altitude         = COALESCE($9, altitude),
           avg_speed        = COALESCE($10, avg_speed),
           avg_pace         = COALESCE($11, avg_pace),
           updated_at       = NOW()
         WHERE id = $12 RETURNING *`,
        [training_type_id, start_point, end_point, distance_km, duration_seconds,
         temperature_c, training_date, notes, altitude,
         metrics.avg_speed, metrics.avg_pace, sessionId]
      );

      if (kilometer_splits.length) {
        await client.query('DELETE FROM kilometer_splits WHERE session_id = $1', [sessionId]);
        for (const s of kilometer_splits) {
          await client.query(
            `INSERT INTO kilometer_splits (session_id, kilometer_number, split_seconds)
             VALUES ($1,$2,$3)`,
            [sessionId, s.kilometer_number, s.split_seconds]
          );
        }
      }

      await client.query(
        `UPDATE performance_metrics
         SET avg_speed_kmh = $1, avg_pace_seconds = $2, calories_burned = $3
         WHERE session_id = $4`,
        [metrics.avg_speed, metrics.avg_pace, metrics.calories_burned, sessionId]
      );

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_name, entity_id)
         VALUES ($1,'UPDATE','training_sessions',$2)`,
        [userId, sessionId]
      );

      const effectiveDate = training_date || check.rows[0].training_date;
      await SessionModel._refreshWeekly(client, userId, effectiveDate);
      await client.query('COMMIT');
      return sessRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /** Delete session */
  delete: async (sessionId, userId) => {
    const res = await query(
      'DELETE FROM training_sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [sessionId, userId]
    );
    return res.rows[0] || null;
  },

  /** Dashboard summary */
  getSummary: async (userId) => {
    const overall = await query(
      `SELECT COUNT(*)::int                         AS total_sessions,
              ROUND(SUM(distance_km)::numeric,2)    AS total_distance_km,
              SUM(duration_seconds)                 AS total_duration_seconds,
              ROUND(AVG(avg_speed)::numeric,2)      AS avg_speed_kmh,
              MIN(avg_pace)                         AS best_pace_sec_per_km
       FROM training_sessions WHERE user_id = $1`,
      [userId]
    );
    const week = await query(
      `SELECT ROUND(SUM(distance_km)::numeric,2) AS distance_km,
              SUM(duration_seconds)              AS duration_seconds,
              COUNT(*)::int                      AS sessions
       FROM training_sessions
       WHERE user_id = $1 AND training_date >= date_trunc('week', CURRENT_DATE)`,
      [userId]
    );
    const month = await query(
      `SELECT ROUND(SUM(distance_km)::numeric,2) AS distance_km,
              SUM(duration_seconds)              AS duration_seconds,
              COUNT(*)::int                      AS sessions
       FROM training_sessions
       WHERE user_id = $1 AND training_date >= date_trunc('month', CURRENT_DATE)`,
      [userId]
    );
    const byType = await query(
      `SELECT tt.name AS training_type, COUNT(ts.id)::int AS sessions,
              ROUND(SUM(ts.distance_km)::numeric,2) AS total_distance_km
       FROM training_sessions ts
       JOIN training_types tt ON tt.id = ts.training_type_id
       WHERE ts.user_id = $1 GROUP BY tt.name ORDER BY total_distance_km DESC`,
      [userId]
    );
    return {
      overall:           overall.rows[0],
      this_week:         week.rows[0],
      this_month:        month.rows[0],
      by_training_type:  byType.rows,
    };
  },

  /** Time-series trends */
  getTrends: async (userId, period = 'daily', limit = 30) => {
    const trunc = period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'day';
    const agg = await query(
      `SELECT date_trunc($1, training_date)            AS period_start,
              ROUND(SUM(distance_km)::numeric,2)       AS total_distance_km,
              SUM(duration_seconds)                    AS total_duration_seconds,
              COUNT(*)::int                            AS sessions,
              ROUND(AVG(avg_speed)::numeric,2)         AS avg_speed_kmh,
              ROUND(AVG(avg_pace)::numeric,0)          AS avg_pace_sec_per_km
       FROM training_sessions WHERE user_id = $2
       GROUP BY date_trunc($1, training_date)
       ORDER BY period_start DESC LIMIT $3`,
      [trunc, userId, limit]
    );
    const perSession = await query(
      `SELECT id, training_date, distance_km, avg_speed, avg_pace,
              duration_seconds, training_type_id
       FROM training_sessions
       WHERE user_id = $1 AND avg_speed IS NOT NULL
       ORDER BY training_date DESC LIMIT $2`,
      [userId, limit]
    );
    return {
      aggregated:  agg.rows.reverse(),
      per_session: perSession.rows.reverse(),
    };
  },

  /** Weekly summary history */
  getWeeklySummaries: async (userId, limit = 12) => {
    const res = await query(
      `SELECT week_start_date, total_distance_km,
              total_duration_seconds, total_sessions
       FROM weekly_summaries WHERE user_id = $1
       ORDER BY week_start_date DESC LIMIT $2`,
      [userId, limit]
    );
    return res.rows.reverse();
  },

  /** Personal records */
  getBest: async (userId) => {
    const fastest = await query(
      `SELECT ts.id, ts.training_date, ts.distance_km, ts.avg_speed, ts.avg_pace,
              tt.name AS training_type
       FROM training_sessions ts LEFT JOIN training_types tt ON tt.id = ts.training_type_id
       WHERE ts.user_id = $1 AND ts.avg_speed IS NOT NULL
       ORDER BY ts.avg_speed DESC LIMIT 5`,
      [userId]
    );
    const longest = await query(
      `SELECT ts.id, ts.training_date, ts.distance_km, ts.duration_seconds,
              tt.name AS training_type
       FROM training_sessions ts LEFT JOIN training_types tt ON tt.id = ts.training_type_id
       WHERE ts.user_id = $1 AND ts.distance_km IS NOT NULL
       ORDER BY ts.distance_km DESC LIMIT 5`,
      [userId]
    );
    const splits = await query(
      `SELECT ks.kilometer_number,
              ROUND(AVG(ks.split_seconds)::numeric,0) AS avg_split_seconds,
              MIN(ks.split_seconds) AS best_split_seconds,
              COUNT(*)::int AS data_points
       FROM kilometer_splits ks
       JOIN training_sessions ts ON ts.id = ks.session_id
       WHERE ts.user_id = $1
       GROUP BY ks.kilometer_number ORDER BY ks.kilometer_number`,
      [userId]
    );
    return { fastest: fastest.rows, longest: longest.rows, split_analysis: splits.rows };
  },

  /** This week vs last week comparison */
  getComparison: async (userId) => {
    const res = await query(
      `SELECT 'this_week' AS period,
              ROUND(SUM(distance_km)::numeric,2) AS distance_km,
              SUM(duration_seconds)              AS duration_seconds,
              COUNT(*)::int                      AS sessions,
              ROUND(AVG(avg_speed)::numeric,2)   AS avg_speed
       FROM training_sessions
       WHERE user_id = $1 AND training_date >= date_trunc('week', CURRENT_DATE)
       UNION ALL
       SELECT 'last_week',
              ROUND(SUM(distance_km)::numeric,2),
              SUM(duration_seconds), COUNT(*)::int,
              ROUND(AVG(avg_speed)::numeric,2)
       FROM training_sessions
       WHERE user_id = $1
         AND training_date >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days'
         AND training_date <  date_trunc('week', CURRENT_DATE)`,
      [userId]
    );
    const map = {};
    res.rows.forEach(r => { map[r.period] = r; });
    const tw = map['this_week'] || {};
    const lw = map['last_week'] || {};
    const pct = (a, b) => (!a || !b) ? null : parseFloat(((a - b) / (b || 1) * 100).toFixed(1));
    return {
      this_week: tw,
      last_week: lw,
      changes: {
        distance_pct:  pct(tw.distance_km, lw.distance_km),
        sessions_pct:  pct(tw.sessions, lw.sessions),
        avg_speed_pct: pct(tw.avg_speed, lw.avg_speed),
      },
    };
  },

  /** Internal: refresh weekly_summaries table */
  _refreshWeekly: async (client, userId, date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const weekStart = d.toISOString().split('T')[0];

    const agg = await client.query(
      `SELECT ROUND(SUM(distance_km)::numeric,2) AS dist,
              SUM(duration_seconds) AS dur, COUNT(*)::int AS sess
       FROM training_sessions
       WHERE user_id = $1
         AND training_date >= $2
         AND training_date < ($2::date + INTERVAL '7 days')`,
      [userId, weekStart]
    );
    const { dist, dur, sess } = agg.rows[0];
    await client.query(
      `INSERT INTO weekly_summaries
         (user_id, week_start_date, total_distance_km, total_duration_seconds, total_sessions)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, week_start_date) DO UPDATE
         SET total_distance_km      = EXCLUDED.total_distance_km,
             total_duration_seconds = EXCLUDED.total_duration_seconds,
             total_sessions         = EXCLUDED.total_sessions`,
      [userId, weekStart, dist, dur, sess]
    );
  },
};

module.exports = SessionModel;