const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiError = require('./apiError');
function signAccessToken(user) {
    return jwt.sign({
        sub: user._id.toString(),
        role: user.role
    }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h'
    });
}
function signRefreshToken(user) {
    return jwt.sign({
        sub: user._id.toString(),
        type: 'refresh'
    }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
}
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
function verifyAccessToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    }
    catch {
        throw new ApiError(401, 'Invalid or expired access token');
    }
}
function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    }
    catch {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }
}
function parseDurationMs(value) {
    const m = String(value || '7d').match(/^(\d+)([smhd])$/);
    if (!m)
        return 7 * 24 * 60 * 60 * 1000;
    const unit = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000
    }[m[2]];
    return Number(m[1]) * unit;
}
function refreshCookieOptions() {
    return {
        httpOnly: true,
        secure: String(process.env.COOKIE_SECURE || 'false') === 'true',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
    };
}
module.exports = {
    signAccessToken,
    signRefreshToken,
    hashToken,
    verifyAccessToken,
    verifyRefreshToken,
    refreshCookieOptions,
    parseDurationMs
};
