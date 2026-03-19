const authService = require("../services/authService");

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // This log will show up in your BACKEND terminal
    console.log("Registration attempt for:", email);

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ status: "fail", message: "Missing fields" });
    }

    const user = await authService.register(name, email, password);
    res.status(201).json({ status: "success", data: user });
  } catch (error) {
    console.error("DETAILED REGISTER ERROR:", error);
    // This sends the actual database error back to the frontend
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({ status: "success", ...result });
  } catch (error) {
    console.error("DETAILED LOGIN ERROR:", error);
    res.status(401).json({ status: "fail", message: error.message });
  }
};
