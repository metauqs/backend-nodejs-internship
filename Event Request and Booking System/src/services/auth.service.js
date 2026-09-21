const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const AppError = require("../utils/AppError");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require("../utils/jwt");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshExpiryDate() {
  const days = Number.parseInt(
    process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    10
  );
  const safeDays = Number.isFinite(days) ? days : 7;
  return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

async function issueTokens(user) {
  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role
  });

  const refreshToken = signRefreshToken({
    userId: user._id.toString()
  });

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiryDate()
  });

  return { accessToken, refreshToken };
}

async function register({ name, email, password, role }) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: role || "USER"
  });

  const tokens = await issueTokens(user);

  return {
    user: publicUser(user),
    ...tokens
  };
}

async function login({ email, password }) {
  const user = await User.findOne({
    email: email.toLowerCase().trim()
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }

  const tokens = await issueTokens(user);

  return {
    user: publicUser(user),
    ...tokens
  };
}

async function refresh({ refreshToken }) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored || stored.expiresAt <= new Date()) {
    throw new AppError("Refresh token is invalid or expired", 401);
  }

  if (stored.user.toString() !== payload.userId) {
    throw new AppError("Refresh token does not match user", 401);
  }

  await RefreshToken.deleteOne({ _id: stored._id });

  const user = await User.findById(payload.userId);

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  const tokens = await issueTokens(user);

  return {
    user: publicUser(user),
    ...tokens
  };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  publicUser
};