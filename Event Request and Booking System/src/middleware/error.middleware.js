function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((item) => item.message)
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID"
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists"
    });
  }

  const status = err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    ...(err.details ? { details: err.details } : {})
  });
}

module.exports = { notFound, errorHandler };