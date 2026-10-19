const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { verifyAccessToken } = require('../utils/tokens');
async function authMiddleware(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer '))
            throw new ApiError(401, 'Authentication token is required');
        const payload = verifyAccessToken(auth.slice(7).trim());
        const user = await User.findById(payload.sub).select('-password');
        if (!user)
            throw new ApiError(401, 'Authenticated user no longer exists');
        req.user = user;
        next();
    }
    catch (err) {
        next(err);
    }
}
module.exports = authMiddleware;
