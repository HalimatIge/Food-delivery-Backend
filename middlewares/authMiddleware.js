const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.cookies.token;

  // If no cookie, check Authorization header (mobile)
  if (!token && req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({
      status: false,
      message: "No token found in cookies",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ status: false, message: "Invalid token" });
  }
};

module.exports = { protect };
