const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const AuthService = {
  signToken: (id, role) =>
    jwt.sign({ id, role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }),

  register: async ({ name, email, password, fullName, gender, birthDate, heightCm, weightKg, preferredUnit }) => {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      name, email, passwordHash,
      fullName, gender, birthDate,
      heightCm, weightKg, preferredUnit,
    });

    const token = AuthService.signToken(user.id, user.role);
    return { user, token };
  },

  login: async (email, password) => {
    const user = await UserModel.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }
    if (!user.is_active) {
      const err = new Error('Account is disabled');
      err.statusCode = 403;
      throw err;
    }

    await UserModel.audit(user.id, 'LOGIN', 'users', user.id);
    const token = AuthService.signToken(user.id, user.role);
    return { user, token };
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    // Need the hash — re-fetch with password
    const { query } = require('../config/db');
    const res = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const { password_hash } = res.rows[0];

    if (!(await bcrypt.compare(currentPassword, password_hash))) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 401;
      throw err;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(userId, newHash);
  },
};

module.exports = AuthService;