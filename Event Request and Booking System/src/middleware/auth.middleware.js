const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError("Authentication token is required", 401);
    }

    const token = header.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId).select("_id name email role");

    if (!user) {
      throw new AppError("Authenticated user no longer exists", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(
      error.statusCode
        ? error
        : new AppError("Invalid or expired access token", 401)
    );
  }
}

module.exports = authenticate;