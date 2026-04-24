const SessionModel = require("../models/sessionModel");
const { computeMetrics } = require("../utils/calculators");

const SessionService = {
  getAllSessions: async (userId, queryParams) => {
    const { page, limit, from_date, to_date, training_type_id } = queryParams;
    return SessionModel.findAll(userId, {
      page: parseInt(page || 1),
      limit: Math.min(100, parseInt(limit || 10)),
      fromDate: from_date,
      toDate: to_date,
      trainingTypeId: training_type_id,
    });
  },

  getSession: async (sessionId, userId) => {
    const session = await SessionModel.findById(sessionId, userId);
    if (!session) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }
    return session;
  },

  createSession: async (userId, data) => {
    const { distance_km, duration_seconds, training_type_id } = data;
    // Fetch type name for calorie estimation
    const { query } = require("../config/db");
    const typeRes = await query(
      "SELECT name FROM training_types WHERE id = $1",
      [training_type_id],
    );
    const typeName = typeRes.rows[0]?.name || "";

    const metrics = computeMetrics(distance_km, duration_seconds, typeName);
    return SessionModel.create(userId, data, metrics);
  },

  updateSession: async (sessionId, userId, data) => {
    const { distance_km, duration_seconds } = data;
    const metrics = computeMetrics(distance_km, duration_seconds, "");
    const updated = await SessionModel.update(sessionId, userId, data, metrics);
    if (!updated) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }
    return updated;
  },

  deleteSession: async (sessionId, userId) => {
    const deleted = await SessionModel.delete(sessionId, userId);
    if (!deleted) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }
    return deleted;
  },

  getSummary: (userId) => SessionModel.getSummary(userId),
  getTrends: (userId, period, limit) =>
    SessionModel.getTrends(userId, period, limit),
  getWeeklySummaries: (userId, limit) =>
    SessionModel.getWeeklySummaries(userId, limit),
  getBest: (userId) => SessionModel.getBest(userId),
  getComparison: (userId) => SessionModel.getComparison(userId),
};

module.exports = SessionService;
