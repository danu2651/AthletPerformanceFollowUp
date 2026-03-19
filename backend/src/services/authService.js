const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

/**
 * Register a new athlete
 */
const register = async (name, email, password) => {
  try {
    // 1. Hash the password before saving to DB
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Pass to the model (Maps to your password_hash column)
    const newUser = await User.create(name, email, hashedPassword);

    return newUser;
  } catch (error) {
    // Log the error here so you can see it in your VS Code terminal
    console.error("Service Layer Error (Register):", error);
    throw error;
  }
};

/**
 * Login an athlete
 */
const login = async (email, password) => {
  try {
    // 1. Find the user by email
    const user = await User.findByEmail(email);
    if (!user) throw new Error("User not found");

    // 2. Compare incoming password with stored password_hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error("Invalid credentials");

    // 3. Generate JWT Token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "24h" },
    );

    // 4. Return user data (without password) and token
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  } catch (error) {
    console.error("Service Layer Error (Login):", error);
    throw error;
  }
};

// EXPORT BOTH FUNCTIONS CORRECTLY
module.exports = {
  register,
  login,
};
