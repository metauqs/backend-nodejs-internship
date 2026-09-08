const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/token");
const userRepository = require("../repositories/userRepository");

async function authenticate(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      throw new ApiError(401, "Authentication token is required");
    }

    const parts = authorizationHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      throw new ApiError(401, "Authorization header must use Bearer token");
    }

    const token = parts[1];

    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, "Authentication token has expired");
      }

      throw new ApiError(401, "Invalid authentication token");
    }

    const user = await userRepository.findUserById(payload.userId);

    if (!user) {
      throw new ApiError(401, "User for this token no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;
