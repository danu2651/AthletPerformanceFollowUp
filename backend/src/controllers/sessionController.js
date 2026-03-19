const Session = require("../models/sessionModel");
const db = require("../config/db");

/**
 * @desc Record session + splits (SRS 3.2 & 3.3)
 */
exports.createSession = async (req, res, next) => {
  try {
    const userId = req.userData?.userId || req.userData?.id;
    const { distance_km, duration_seconds, splits } = req.body;

    const dist = parseFloat(distance_km);
    const timeInHours = parseInt(duration_seconds) / 3600;

    const avg_speed = dist > 0 && timeInHours > 0 
      ? parseFloat((dist / timeInHours).toFixed(2)) 
      : 0;

    const avg_pace = dist > 0 
      ? parseFloat((parseInt(duration_seconds) / 60 / dist).toFixed(2)) 
      : 0;

    const session = await Session.createWithSplits(
      {
        ...req.body,
        user_id: userId,
        avg_speed,
        avg_pace,
      },
      splits || []
    );

    res.status(201).json({
      status: "success",
      message: "Session recorded successfully",
      data: session,
    });
  } catch (error) {
    console.error("Create Session Error:", error);
    next(error);
  }
};

/**
 * @desc Advanced Dashboard Analytics (SRS 3.4)
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.userData?.userId || req.userData?.id;
    const stats = await Session.getDeepAnalytics(userId);

    const chartQuery = `
      SELECT TO_CHAR(training_date, 'YYYY-MM-DD') as date, avg_speed as speed
      FROM training_sessions 
      WHERE user_id = $1 
      ORDER BY training_date DESC 
      LIMIT 10
    `;
    const chartRes = await db.query(chartQuery, [userId]);

    const current = parseFloat(stats?.current_week_km) || 0;
    const last = parseFloat(stats?.last_week_km) || 0;

    let diff = 0;
    if (last > 0) {
      diff = parseFloat((((current - last) / last) * 100).toFixed(1));
    } else if (current > 0) {
      diff = 100;
    }

    res.status(200).json({
      status: "success",
      data: {
        summary: stats || {},
        chart_data: (chartRes.rows || []).reverse(),
        performance_diff: diff,
      },
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    next(error);
  }
};

/**
 * @desc List all sessions for user
 */
exports.getUserSessions = async (req, res, next) => {
  try {
    const userId = req.userData?.userId || req.userData?.id;
    const query = `SELECT * FROM training_sessions WHERE user_id = $1 ORDER BY training_date DESC`;
    const result = await db.query(query, [userId]);
    
    res.status(200).json({
      status: "success",
      results: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a session (SRS 7.0)
 * This was the missing function causing your crash!
 */
exports.deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userData?.userId || req.userData?.id;

    const result = await db.query(
      "DELETE FROM training_sessions WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Session not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Session deleted successfully"
    });
  } catch (error) {
    console.error("Delete Error:", error);
    next(error);
  }
};