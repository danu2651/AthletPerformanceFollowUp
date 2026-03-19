const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // Check if the Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    // Use your env secret or fallback
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecretkey",
    );

    // STANDARD: We use req.userData for all following requests
    req.userData = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Authentication failed: Invalid token" });
  }
};
