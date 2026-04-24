// backend/src/controllers/authController.js
const AuthService = require("../services/authService");
const UserModel = require("../models/userModel");

const authController = {
  register: async (req, res, next) => {
    try {
      // Destructure fields from request body
      const {
        name,
        email,
        password,
        full_name,
        gender,
        birth_date,
        height_cm,
        weight_kg,
        preferred_unit,
      } = req.body;

      // VALIDATION: Ensure core fields exist before calling Service
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Registration failed: name, email, and password are required.",
        });
      }

      // Map incoming snake_case to the camelCase expected by your AuthService
      const { user, token } = await AuthService.register({
        name,
        email,
        password,
        fullName: full_name || null, // Made optional
        gender: gender || null, // Made optional
        birthDate: birth_date || null,
        heightCm: height_cm || null,
        weightKg: weight_kg || null,
        preferredUnit: preferred_unit || "metric",
      });

      res.status(201).json({
        success: true,
        message: "Registration successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Registration Error:", err.message);
      // Passing to global error handler
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // BASIC VALIDATION
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Validation failed: Email and password are required.",
        });
      }

      const { user, token } = await AuthService.login(email, password);

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Login Error:", err.message);
      // Ensure we send a clean error message to the frontend
      res.status(401).json({
        success: false,
        message: err.message || "Invalid credentials",
      });
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.user.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  getProfile: async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Profile not found" });
      }
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
  // ... rest of your existing methods (updateProfile, etc.) stay the same
};

module.exports = authController;
