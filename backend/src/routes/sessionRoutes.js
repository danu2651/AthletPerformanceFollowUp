const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const router = express.Router();
const ctrl = require("../controllers/sessionController");
const auth = require("../middleware/authMiddleware");

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

// --- VALIDATION HELPER ---
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Protect all routes in this file
router.use(auth);

// --- VALIDATION RULES ---
const sessionBody = [
  body("training_type_id")
    .isInt({ min: 1 })
    .withMessage("Valid training_type_id required"),

  body("duration_seconds")
    .isInt({ min: 1 })
    .withMessage("duration_seconds must be a positive integer"),

  body("training_date")
    .isISO8601()
    .withMessage("training_date must be YYYY-MM-DD"),

  body("distance_km")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("distance_km must be a non-negative number"),

  body("temperature_c")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat()
    .withMessage("temperature_c must be a valid number"),

  body("altitude")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat()
    .withMessage("altitude must be a valid number"),
];

// ─── ANALYTICS ────────────────────────────────────────────────────────
router.get("/analytics/summary", (req, res, next) =>
  ctrl.getSummary(req, res, next),
);
router.get("/analytics/trends", (req, res, next) =>
  ctrl.getTrends(req, res, next),
);
router.get("/analytics/weekly", (req, res, next) =>
  ctrl.getWeekly(req, res, next),
);
router.get("/analytics/best", (req, res, next) => ctrl.getBest(req, res, next));
router.get("/analytics/comparison", (req, res, next) =>
  ctrl.getComparison(req, res, next),
);

// ─── CRUD ROUTES ──────────────────────────────────────────────────────

// Get all sessions with pagination and date filtering
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("from_date").optional().isISO8601(),
    query("to_date").optional().isISO8601(),
  ],
  validate,
  (req, res, next) => ctrl.getAll(req, res, next),
);

// Create a new session
router.post("/", sessionBody, validate, (req, res, next) =>
  ctrl.create(req, res, next),
);

// Get a single session by ID
router.get(
  "/:id",
  [param("id").isInt({ min: 1 })],
  validate,
  (req, res, next) => ctrl.getOne(req, res, next),
);

// Update a session
router.put(
  "/:id",
  [param("id").isInt({ min: 1 }), ...sessionBody],
  validate,
  (req, res, next) => ctrl.update(req, res, next),
);

// Delete a session
router.delete(
  "/:id",
  [param("id").isInt({ min: 1 })],
  validate,
  (req, res, next) => ctrl.delete(req, res, next),
);

module.exports = router;
