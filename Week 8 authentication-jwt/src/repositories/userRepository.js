const User = require("../models/User");

async function createUser(data) {
  const user = new User(data);
  return await user.save();
}

async function findUserByEmail(email) {
  return await User.findOne({ email: email }).select("+password +refreshToken");
}

async function findUserById(id) {
  return await User.findById(id).select("-password -refreshToken");
}

async function findUserByIdWithSecrets(id) {
  return await User.findById(id).select("+password +refreshToken");
}

async function updateRefreshToken(userId, refreshToken) {
  return await User.findByIdAndUpdate(
    userId,
    { refreshToken: refreshToken },
    { new: true }
  ).select("-password -refreshToken");
}

async function removeRefreshToken(userId) {
  return await User.findByIdAndUpdate(
    userId,
    { refreshToken: null },
    { new: true }
  ).select("-password -refreshToken");
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByIdWithSecrets,
  updateRefreshToken,
  removeRefreshToken
};
