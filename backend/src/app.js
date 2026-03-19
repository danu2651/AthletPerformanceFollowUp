const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// --- Global Middleware ---
// CORS allows your Next.js frontend (port 3000) to talk to this backend
app.use(cors());
// Essential for reading JSON data sent from the Register/Login forms
app.use(express.json());

// --- Route Mounting ---
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

// --- Health Check ---
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "🚀 APTS Backend Live",
    timestamp: new Date().toISOString(),
  });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ status: "fail", message: "Route not found" });
});

// --- Global Error Handler ---
app.use(errorHandler);

module.exports = app;
