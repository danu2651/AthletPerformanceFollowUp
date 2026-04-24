const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// ── Security ──────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Global rate limit: 200 req / 15 min
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: "Too many requests — slow down" },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Auth-specific: 30 req / 15 min (Place this BEFORE the routes)
app.use(
  "/api/auth/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: "Too many auth attempts — try later" },
  }),
);

// ── Parsing ───────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Root & Health ─────────────────────────────
// Adding this fixes the "GET / 404" error you saw
app.get("/", (_req, res) =>
  res.send("APTS API is active. Navigate to /health or /api for endpoints."),
);

app.get("/health", (_req, res) =>
  res.json({ success: true, status: "OK", ts: new Date().toISOString() }),
);

// ── Routes ────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

// ── Errors (Always keep these at the bottom) ──
app.use(notFound);
app.use(errorHandler);

module.exports = app;
