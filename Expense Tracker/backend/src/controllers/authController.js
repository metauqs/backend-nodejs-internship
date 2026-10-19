const authService = require('../services/authService');
const { refreshCookieOptions } = require('../utils/tokens');
const asyncHandler = require('../utils/asyncHandler');

function getRefreshToken(req) {
    return req.body?.refreshToken || req.cookies?.expense_tracker_refresh;
}

function setRefreshCookie(res, result) {
    if (result.refreshToken) {
        res.cookie(
            'expense_tracker_refresh',
            result.refreshToken,
            refreshCookieOptions()
        );
    }
}

function clearRefreshCookie(res) {
    res.clearCookie('expense_tracker_refresh', {
        ...refreshCookieOptions(),
        maxAge: 0,
    });
}

function sendAuthResponse(res, statusCode, result, message) {
    // Keep aliases at the top level for the existing frontend AuthContext.
    return res.status(statusCode).json({
        success: true,
        message,
        ...result,
        data: result,
    });
}

exports.register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    setRefreshCookie(res, result);
    return sendAuthResponse(res, 201, result, 'Registration successful');
});

exports.login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    setRefreshCookie(res, result);
    return sendAuthResponse(res, 200, result, 'Login successful');
});

exports.refresh = asyncHandler(async (req, res) => {
    const result = await authService.refresh(getRefreshToken(req));
    setRefreshCookie(res, result);
    return sendAuthResponse(res, 200, result, 'Token refreshed');
});

exports.logout = asyncHandler(async (req, res) => {
    await authService.logout(getRefreshToken(req), req.user._id);
    clearRefreshCookie(res);

    return res.status(200).json({
        success: true,
        message: 'Logged out',
    });
});

exports.getProfile = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user._id);

    return res.status(200).json({
        success: true,
        message: 'Profile fetched',
        user,
        data: { user },
    });
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user._id, req.body);

    return res.status(200).json({
        success: true,
        message: 'Profile updated',
        user,
        data: { user },
    });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
    const file = req.file || (req.files && (req.files.avatar?.[0] || req.files.file?.[0]));
    if (!file) {
        throw new ApiError(400, 'Please select an image file to upload');
    }

    const user = await authService.uploadAvatar(req.user._id, file);

    return res.status(200).json({
        success: true,
        message: 'Profile photo updated successfully',
        user,
        data: { user },
    });
});

exports.removeAvatar = asyncHandler(async (req, res) => {
    const user = await authService.removeAvatar(req.user._id);

    return res.status(200).json({
        success: true,
        message: 'Profile photo removed',
        user,
        data: { user },
    });
});

exports.changePassword = asyncHandler(async (req, res) => {
    await authService.changePassword(
        req.user._id,
        req.body.currentPassword,
        req.body.newPassword
    );
    clearRefreshCookie(res);

    return res.status(200).json({
        success: true,
        message: 'Password updated. Please log in again.',
        data: null,
    });
});
