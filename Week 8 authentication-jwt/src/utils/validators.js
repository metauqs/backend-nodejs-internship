function validateRegisterInput(data) {
  const errors = [];

  if (typeof data.name !== "string" || data.name.trim().length < 2) {
    errors.push("Name must contain at least 2 characters");
  }

  if (typeof data.email !== "string" || data.email.indexOf("@") === -1) {
    errors.push("A valid email is required");
  }

  if (typeof data.password !== "string" || data.password.length < 8) {
    errors.push("Password must contain at least 8 characters");
  }

  return errors;
}

function validateLoginInput(data) {
  const errors = [];

  if (typeof data.email !== "string" || data.email.indexOf("@") === -1) {
    errors.push("A valid email is required");
  }

  if (typeof data.password !== "string" || data.password.length === 0) {
    errors.push("Password is required");
  }

  return errors;
}

function validateRefreshTokenInput(data) {
  const errors = [];

  if (typeof data.refreshToken !== "string" || data.refreshToken.trim().length === 0) {
    errors.push("Refresh token is required");
  }

  return errors;
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateRefreshTokenInput
};
