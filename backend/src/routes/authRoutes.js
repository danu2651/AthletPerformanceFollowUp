const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware"); // This is now the 'auth' function

// --- PUBLIC ROUTES ---
router.post("/register", (req, res, next) =>
  authController.register(req, res, next),
);
router.post("/login", (req, res, next) => authController.login(req, res, next));

// --- PROTECTED ROUTES ---

// Now 'auth' is a function, so this will NOT throw [object Object]
router.get("/me", auth, (req, res, next) => {
  if (typeof authController.getMe === "function") {
    return authController.getMe(req, res, next);
  }
  res.status(500).json({ error: "Controller function getMe not found" });
});

router.get("/profile", auth, (req, res, next) => {
  if (typeof authController.getProfile === "function") {
    return authController.getProfile(req, res, next);
  }
  res.status(500).json({ error: "Controller function getProfile not found" });
});

module.exports = router;
