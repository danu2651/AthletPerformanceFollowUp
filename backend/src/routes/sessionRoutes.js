const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
const authMiddleware = require("../middleware/authMiddleware");

// PROTECT ALL ROUTES
router.use(authMiddleware);

/**
 * ANALYTICS (SRS 3.4)
 * Defined first to avoid conflict with /:id
 */
router.get("/analytics/summary", sessionController.getAnalytics);

/**
 * SESSION OPERATIONS
 */
router.post("/", sessionController.createSession);
router.get("/", sessionController.getUserSessions);
router.delete("/:id", sessionController.deleteSession);

module.exports = router;