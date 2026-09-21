const AppError = require("../utils/AppError");

// Used by POST /events — all fields required
function validateEventInput(req, res, next) {
  const { title, description, date, location, capacity } = req.body;
  const errors = [];

  if (!title || String(title).trim().length < 3) errors.push("Title must be at least 3 characters");
  if (!description || String(description).trim().length < 3) errors.push("Description is required");
  if (!date || Number.isNaN(Date.parse(date))) errors.push("A valid date is required");
  if (!location || String(location).trim().length < 2) errors.push("Location is required");
  if (capacity === undefined || Number(capacity) < 1 || !Number.isFinite(Number(capacity))) {
    errors.push("Capacity must be a positive number");
  }

  if (errors.length) return next(new AppError("Validation failed", 400, errors));
  next();
}

// Used by PATCH /events/:id — only validates fields that are present
function validateEventPatch(req, res, next) {
  const { title, description, date, location, capacity } = req.body;
  const hasFile = !!req.file;
  const errors = [];

  if (
    !hasFile &&
    title === undefined &&
    description === undefined &&
    date === undefined &&
    location === undefined &&
    capacity === undefined
  ) {
    return next(new AppError("No updatable fields provided", 400));
  }

  if (title !== undefined && String(title).trim().length < 3)
    errors.push("Title must be at least 3 characters");

  if (description !== undefined && String(description).trim().length < 3)
    errors.push("Description must be at least 3 characters");

  if (date !== undefined && Number.isNaN(Date.parse(date)))
    errors.push("A valid date is required");

  if (location !== undefined && String(location).trim().length < 2)
    errors.push("Location is required");

  if (
    capacity !== undefined &&
    (Number(capacity) < 1 || !Number.isFinite(Number(capacity)))
  ) {
    errors.push("Capacity must be a positive number");
  }

  if (errors.length) return next(new AppError("Validation failed", 400, errors));
  next();
}

module.exports = { validateEventInput, validateEventPatch };