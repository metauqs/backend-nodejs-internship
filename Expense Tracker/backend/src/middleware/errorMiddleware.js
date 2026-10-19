const mongoose = require('mongoose');

function notFound(req, res) {
    return res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);

    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: Object.values(error.errors).map((item) => item.message),
        });
    }

    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            success: false,
            message: `Invalid ${error.path || 'resource'} ID`,
        });
    }

    if (error?.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'A record with this unique value already exists',
        });
    }

    if (error?.name === 'MulterError') {
        const tooLarge = error.code === 'LIMIT_FILE_SIZE';
        return res.status(tooLarge ? 413 : 400).json({
            success: false,
            message: tooLarge ? 'File size must be 5 MB or less' : error.message,
        });
    }

    const statusCode = Number(error.statusCode) || 500;
    if (statusCode >= 500) console.error(error);

    const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : (error.message || 'Internal server error');

    return res.status(statusCode).json({
        success: false,
        message,
        ...(error.details ? { details: error.details } : {}),
    });
}

module.exports = {
    notFound,
    errorHandler,
};
