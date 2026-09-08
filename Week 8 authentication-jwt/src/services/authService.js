const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const ApiError = require("../utils/ApiError");
const {
  validateRegisterInput,
  validateLoginInput,
  validateRefreshTokenInput
} = require("../utils/validators");
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} = require("../utils/token");

function createSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function register(data) {
  const errors = validateRegisterInput(data);

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  const email = data.email.toLowerCase().trim();
  const existingUser = await userRepository.findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  try {
    const user = await userRepository.createUser({
      name: data.name.trim(),
      email: email,
      password: hashedPassword
    });

    return createSafeUser(user);
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Email already registered");
    }
    throw error;
  }
}

async function login(data) {
  const errors = validateLoginInput(data);

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  const email = data.email.toLowerCase().trim();
  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(data.password, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  await userRepository.updateRefreshToken(user._id, refreshToken);

  return {
    user: createSafeUser(user),
    accessToken,
    refreshToken
  };
}

async function refresh(data) {
  const errors = validateRefreshTokenInput(data);

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  const incomingRefreshToken = data.refreshToken;

  let payload;

  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Refresh token has expired");
    }

    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await userRepository.findUserByIdWithSecrets(payload.userId);

  if (!user || !user.refreshToken) {
    throw new ApiError(401, "Refresh token is invalid or has been revoked");
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is invalid or has been rotated");
  }

  const newAccessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);

  await userRepository.updateRefreshToken(user._id, newRefreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}

async function logout(data) {
  const errors = validateRefreshTokenInput(data);

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  const incomingRefreshToken = data.refreshToken;

  let payload;

  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Refresh token has expired");
    }

    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await userRepository.findUserByIdWithSecrets(payload.userId);

  if (!user || !user.refreshToken) {
    throw new ApiError(401, "Refresh token is invalid or has been revoked");
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is invalid or has been rotated");
  }

  await userRepository.removeRefreshToken(user._id);
}

module.exports = {
  register,
  login,
  refresh,
  logout
};
