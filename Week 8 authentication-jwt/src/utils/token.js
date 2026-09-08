const jwt = require("jsonwebtoken");

function createAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES
    }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString()
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
