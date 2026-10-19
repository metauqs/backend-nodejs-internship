function sendSuccess(res, statusCode = 200, data = null, message = 'Success', extra = {}) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...extra
    });
}
module.exports = {
    sendSuccess
};
