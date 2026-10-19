const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/apiError');
const {
    signAccessToken,
    signRefreshToken,
    hashToken,
    verifyRefreshToken,
    parseDurationMs,
} = require('../utils/tokens');
const { uploadBuffer, deleteUpload } = require('./uploadService');

const ALLOWED_CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'INR'];
const PASSWORD_RULES = {
    minLength: 8,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[^A-Za-z0-9]/,
};

function toPublicUser(user) {
    return {
        id: String(user._id),
        _id: String(user._id),
        name: user.name,
        email: user.email,
        currency: user.currency,
        role: user.role,
        displayName: user.displayName,
        phone: user.phone,
        title: user.title,
        company: user.company,
        location: user.location,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        avatarPreset: user.avatarPreset,
        notifications: user.notifications,
    };
}

function validatePassword(password) {
    const isValid = typeof password === 'string'
        && password.length >= PASSWORD_RULES.minLength
        && PASSWORD_RULES.uppercase.test(password)
        && PASSWORD_RULES.lowercase.test(password)
        && PASSWORD_RULES.number.test(password)
        && PASSWORD_RULES.special.test(password);

    if (!isValid) {
        throw new ApiError(
            400,
            'Password must be at least 8 characters and include uppercase, lowercase, number and special character'
        );
    }
}

async function issueTokens(user) {
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await RefreshToken.create({
        user: user._id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(
            Date.now() + parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
        ),
    });

    // `token` is retained as an alias because the existing React AuthContext uses it.
    return {
        token: accessToken,
        accessToken,
        refreshToken,
        user: toPublicUser(user),
    };
}

async function register(payload) {
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const password = payload.password;

    if (name.length < 2) {
        throw new ApiError(400, 'Name must be at least 2 characters');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ApiError(400, 'A valid email address is required');
    }

    validatePassword(password);

    const currency = ALLOWED_CURRENCIES.includes(payload.currency)
        ? payload.currency
        : 'PKR';
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(409, 'Email is already registered');
    }

    const user = await User.create({ name, email, password, currency });
    return issueTokens(user);
}

async function login({ email, password }) {
    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({
        email: String(email).trim().toLowerCase(),
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(401, 'Invalid email or password');
    }

    return issueTokens(user);
}

async function refresh(refreshToken) {
    if (!refreshToken) {
        throw new ApiError(401, 'Refresh token is required');
    }

    const payload = verifyRefreshToken(refreshToken);
    if (payload.type !== 'refresh' || !payload.sub) {
        throw new ApiError(401, 'Invalid refresh token');
    }

    const savedToken = await RefreshToken.findOne({
        tokenHash: hashToken(refreshToken),
        user: payload.sub,
    });

    if (!savedToken || savedToken.expiresAt <= new Date()) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, 'User no longer exists');

    // Rotate refresh tokens: the previous token cannot be reused after this point.
    await RefreshToken.deleteOne({ _id: savedToken._id });
    return issueTokens(user);
}

async function logout(refreshToken, userId) {
    if (refreshToken) {
        await RefreshToken.deleteOne({
            tokenHash: hashToken(refreshToken),
            user: userId,
        });
        return;
    }

    // If the client does not send a refresh token, revoke all sessions for this user.
    await RefreshToken.deleteMany({ user: userId });
}

async function getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return toPublicUser(user);
}

async function updateProfile(userId, body) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const editableFields = [
        'name',
        'displayName',
        'email',
        'phone',
        'title',
        'company',
        'location',
        'bio',
        'avatarUrl',
        'avatarPreset',
        'currency',
    ];

    for (const field of editableFields) {
        if (body[field] === undefined) continue;

        if (field === 'email') {
            const email = String(body.email).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new ApiError(400, 'A valid email address is required');
            }

            const otherUser = await User.findOne({
                email,
                _id: { $ne: userId },
            });
            if (otherUser) throw new ApiError(409, 'Email is already registered');
            user.email = email;
            continue;
        }

        if (field === 'currency') {
            if (!ALLOWED_CURRENCIES.includes(body.currency)) {
                throw new ApiError(400, 'Unsupported currency');
            }
        }

        user[field] = body[field];
    }

    if (body.notifications && typeof body.notifications === 'object') {
        const notificationFields = [
            'budgetAlerts',
            'dailyDigest',
            'weeklyReport',
            'largeTxAlerts',
            'billReminders',
            'monthlyPdf',
        ];

        for (const field of notificationFields) {
            if (body.notifications[field] !== undefined) {
                user.notifications[field] = Boolean(body.notifications[field]);
            }
        }
    }

    await user.save();
    return toPublicUser(user);
}

async function changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'Current and new passwords are required');
    }

    validatePassword(newPassword);

    const user = await User.findById(userId).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
        throw new ApiError(400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    await RefreshToken.deleteMany({ user: userId });

    return true;
}

async function uploadAvatar(userId, file) {
    if (!file || !file.buffer) {
        throw new ApiError(400, 'Image file is required');
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const uploaded = await uploadBuffer(file.buffer, {
        folder: 'expense-tracker/avatars',
        resourceType: 'image',
    });

    const previousPublicId = user.avatarPublicId;
    user.avatarUrl = uploaded.url;
    user.avatarPublicId = uploaded.publicId;

    try {
        await user.save();
    } catch (saveError) {
        await deleteUpload(uploaded.publicId, 'image').catch(() => {});
        throw saveError;
    }

    if (previousPublicId) {
        deleteUpload(previousPublicId, 'image').catch(() => {});
    }

    return toPublicUser(user);
}

async function removeAvatar(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const previousPublicId = user.avatarPublicId;
    user.avatarUrl = '';
    user.avatarPublicId = '';
    await user.save();

    if (previousPublicId) {
        deleteUpload(previousPublicId, 'image').catch(() => {});
    }

    return toPublicUser(user);
}

module.exports = {
    register,
    login,
    refresh,
    logout,
    getProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    changePassword,
    publicUser: toPublicUser,
};
