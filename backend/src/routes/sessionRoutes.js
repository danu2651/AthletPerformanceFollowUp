const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * SECURITY: All routes below this line require a valid JWT token.
 * This ensures req.userData is populated for the controller.
 */
router.use(authMiddleware);

/**
 * ANALYTICS (SRS 3.4)
 * This MUST come before the /:id route, otherwise Express will
 * think "analytics" is an ID and try to run the delete function.
 */
router.get("/analytics/summary", sessionController.getAnalytics);

/**
 * RECORD SESSION (SRS 3.2)
 * POST /api/sessions
 */
router.post("/", sessionController.createSession);

/**
 * LIST SESSIONS
 * GET /api/sessions
 */
router.get("/", sessionController.getUserSessions);

/**
 * DELETE RECORD (SRS 7.0)
 * DELETE /api/sessions/:id
 */
router.delete("/:id", sessionController.deleteSession);

module.exports = router;
