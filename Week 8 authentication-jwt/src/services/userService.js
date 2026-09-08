const userRepository = require("../repositories/userRepository");
const ApiError = require("../utils/ApiError");

async function getProfile(userId) {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
}

module.exports = {
  getProfile
};
