
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");

const adminAuthorization = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token)
      return res.status(401).json({ status: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user || user.role !== "admin")
      return res.status(403).json({ status: false, message: "Admins only" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ status: false, message: "Auth error" });
  }
};

const userAuthorization = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token)
      return res.status(401).json({ status: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user || user.role !== "user")
      return res.status(403).json({ status: false, message: "Users only" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ status: false, message: "Auth error" });
  }
};

module.exports = { adminAuthorization, userAuthorization };
