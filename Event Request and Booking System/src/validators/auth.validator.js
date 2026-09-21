const AppError = require("../utils/AppError");

function validateRegister(req, res, next) {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || String(name).trim().length < 2) errors.push("Name must be at least 2 characters");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("A valid email is required");
  if (!password || String(password).length < 6) errors.push("Password must be at least 6 characters");
  if (role && !["USER", "ORGANIZER"].includes(role)) errors.push("Role must be USER or ORGANIZER");

  if (errors.length) return next(new AppError("Validation failed", 400, errors));
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  next();
}

module.exports = { validateRegister, validateLogin };