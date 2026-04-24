const SessionService = require("../services/sessionService");

/**
 * @desc Record session + splits (SRS 3.2 & 3.3)
 */
exports.createSession = async (req, res, next) => {
  try {
    const userId = req.userData?.userId || req.userData?.id;
    const { distance_km, duration_seconds, splits } = req.body;

    const dist = parseFloat(distance_km);
    const timeInHours = parseInt(duration_seconds) / 3600;

    const avg_speed =
      dist > 0 && timeInHours > 0
        ? parseFloat((dist / timeInHours).toFixed(2))
        : 0;

    const avg_pace =
      dist > 0
        ? parseFloat((parseInt(duration_seconds) / 60 / dist).toFixed(2))
        : 0;

    const session = await Session.createWithSplits(
      {
        ...req.body,
        user_id: userId,
        avg_speed,
        avg_pace,
      },
      splits || [],
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
      data: result.rows,
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
      [id, userId],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Session not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    next(error);
  }
};

const sessionController = {
  // ── CRUD ──────────────────────────────────────
  getAll: async (req, res, next) => {
    try {
      const { total, rows } = await SessionService.getAllSessions(
        req.user.id,
        req.query,
      );
      const page = parseInt(req.query.page || 1);
      const limit = Math.min(100, parseInt(req.query.limit || 10));
      res.json({
        success: true,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        data: rows,
      });
    } catch (err) {
      next(err);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const session = await SessionService.getSession(
        req.params.id,
        req.user.id,
      );
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const session = await SessionService.createSession(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: "Training session recorded",
        data: session,
      });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const session = await SessionService.updateSession(
        req.params.id,
        req.user.id,
        req.body,
      );
      res.json({ success: true, message: "Session updated", data: session });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      await SessionService.deleteSession(req.params.id, req.user.id);
      res.json({ success: true, message: "Session deleted" });
    } catch (err) {
      next(err);
    }
  },

  // ── Analytics ─────────────────────────────────
  getSummary: async (req, res, next) => {
    try {
      const data = await SessionService.getSummary(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getTrends: async (req, res, next) => {
    try {
      const { period = "daily", limit = 30 } = req.query;
      const data = await SessionService.getTrends(
        req.user.id,
        period,
        parseInt(limit),
      );
      res.json({ success: true, data: { period, ...data } });
    } catch (err) {
      next(err);
    }
  },

  getWeekly: async (req, res, next) => {
    try {
      const limit = Math.min(52, parseInt(req.query.limit || 12));
      const data = await SessionService.getWeeklySummaries(req.user.id, limit);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getBest: async (req, res, next) => {
    try {
      const data = await SessionService.getBest(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getComparison: async (req, res, next) => {
    try {
      const data = await SessionService.getComparison(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = sessionController;
