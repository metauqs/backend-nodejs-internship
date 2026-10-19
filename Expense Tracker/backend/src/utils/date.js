const ApiError = require('./apiError');
function parseDate(value, fieldName = 'date', { optional = false, endOfDay = false } = {}) {
    if ((value === undefined || value === null || value === '') && optional)
        return null;
    if (!value)
        throw new ApiError(400, `${fieldName} is required`);
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const d = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
        if (Number.isNaN(d.getTime()))
            throw new ApiError(400, `${fieldName} is invalid`);
        return d;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        throw new ApiError(400, `${fieldName} is invalid`);
    return d;
}
function monthRange(year, month) {
    const y = Number(year), m = Number(month);
    if (!Number.isInteger(y) || y < 1970 || y > 2200 || !Number.isInteger(m) || m < 1 || m > 12) {
        throw new ApiError(400, 'year and month must be valid integers (month 1-12)');
    }
    return {
        start: new Date(Date.UTC(y, m - 1, 1)),
        end: new Date(Date.UTC(y, m, 1))
    };
}
module.exports = {
    parseDate,
    monthRange
};
