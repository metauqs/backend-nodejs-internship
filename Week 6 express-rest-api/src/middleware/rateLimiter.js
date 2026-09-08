const ApiError = require('../utils/ApiError');

const createRateLimiter = ({ windowMs = 60_000, max = 100 } = {}) => {
  const hits = new Map(); // ip -> { count, resetAt }

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return next(
        ApiError.tooManyRequests(
          `Rate limit exceeded. Try again in ${retryAfterSec}s.`
        )
      );
    }

    entry.count += 1;
    next();
  };
};

module.exports = createRateLimiter;
