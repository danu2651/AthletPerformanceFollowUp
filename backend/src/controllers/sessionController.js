const Session = require("../models/sessionModel");
const db = require("../config/db");

/**
 * @desc Record session + splits (SRS 3.2 & 3.3)
 * Merged with automatic calculations and transactional logic
 */
exports.createSession = async (req, res, next) => {
  try {
    const userId = req.userData.userId || req.userData.id;
    const { distance_km, duration_seconds, splits } = req.body;

    // 1. Automatic Performance Calculations (SRS 3.2)
    const dist = parseFloat(distance_km);
    const timeInHours = parseInt(duration_seconds) / 3600;

    // Avoid division by zero
    const avg_speed =
      dist > 0 && timeInHours > 0 ? (dist / timeInHours).toFixed(2) : "0.00";

    const avg_pace =
      dist > 0 ? (parseInt(duration_seconds) / 60 / dist).toFixed(2) : "0.00";

    // 2. Save via Transactional Model (Phase 3: Splits)
    const session = await Session.createWithSplits(
      {
        ...req.body,
        user_id: userId,
        avg_speed,
        avg_pace,
      },
      splits, // This passes the array of KM splits to your model
    );

    res.status(201).json({
      status: "success",
      message: "Full training data synced successfully",
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
    const userId = req.userData.userId || req.userData.id;

    // A. Get Lifetime & Weekly Stats from Model
    const stats = await Session.getDeepAnalytics(userId);

    // B. Get Chart Data (Last 10 Sessions) - SRS 3.3
    const chartQuery = `
      SELECT TO_CHAR(training_date, 'YYYY-MM-DD') as date, avg_speed as speed
      FROM training_sessions 
      WHERE user_id = $1 
      ORDER BY training_date DESC 
      LIMIT 10
    `;
    const chartRes = await db.query(chartQuery, [userId]);

    // C. Calculate Improvement Trend (Phase 4)
    const current = parseFloat(stats.current_week_km) || 0;
    const last = parseFloat(stats.last_week_km) || 0;

    let diff = 0;
    if (last > 0) {
      diff = (((current - last) / last) * 100).toFixed(1);
    } else if (current > 0) {
      diff = 100; // First week improvement
    }

    res.status(200).json({
      status: "success",
      data: {
        summary: stats,
        chart_data: chartRes.rows.reverse(),
        performance_diff: parseFloat(diff),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ... getUserSessions and deleteSession remain same as your provided code
