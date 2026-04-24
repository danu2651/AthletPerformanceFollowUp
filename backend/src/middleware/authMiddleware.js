const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

/** * AUTH MIDDLEWARE 
 * Matches the 'auth' variable used in your routes
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorised — no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user to ensure they still exist and are active
    const result = await query(
      "SELECT id, email, role, is_active FROM users WHERE id = $1",
      [decoded.id],
    );

    if (!result.rows.length || !result.rows[0].is_active) {
      return res
        .status(401)
        .json({ success: false, message: "User not found or inactive" });
    }

    // Attach user to the request object
    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Token expired — please log in again",
        });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

/** Restrict to specific roles (Used for Admin features) */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' cannot perform this action`,
    });
  }
  next();
};

// KEY FIX: Export the 'auth' function directly so the router can use it
module.exports = auth; 
// Optional: If you need restrictTo elsewhere, you can do: module.exports.restrictTo = restrictTo;