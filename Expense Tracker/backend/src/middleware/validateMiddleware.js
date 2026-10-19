const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');

function requireObjectId(param = 'id') {
    return (req, res, next) => {
        if (!mongoose.isValidObjectId(req.params[param])) {
            next(new ApiError(400, `Invalid ${param}`));
            return;
        }

        next();
    };
}

function requirePositiveAmount(req, res, next) {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        next(new ApiError(400, 'Amount must be greater than zero'));
        return;
    }

    next();
}

module.exports = {
    requireObjectId,
    requirePositiveAmount,
};
