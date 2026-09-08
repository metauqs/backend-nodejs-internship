const ApiError = require('../utils/ApiError');


const validate = (schemas) => (req, res, next) => {
  const toValidate = Object.keys(schemas).filter((key) => schemas[key]);
  const errors = [];

  toValidate.forEach((key) => {
    const { error, value } = schemas[key].validate(req[key], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      error.details.forEach((d) =>
        errors.push({ field: d.path.join('.'), message: d.message })
      );
    } else {
      req[key] = value;
    }
  });

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};

module.exports = validate;
