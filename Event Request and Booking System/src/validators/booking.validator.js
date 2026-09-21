const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

function validateObjectIdParam(paramName) {
  return (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[paramName])) {
      return next(new AppError(`Invalid ${paramName}`, 400));
    }

    next();
  };
}

module.exports = { validateObjectIdParam };