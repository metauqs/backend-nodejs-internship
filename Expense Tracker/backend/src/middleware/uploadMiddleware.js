const multer = require('multer');
const ApiError = require('../utils/apiError');
const storage = multer.memoryStorage();
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
function fileFilter(req, file, cb) {
    if (!allowed.has(file.mimetype))
        return cb(new ApiError(400, 'Only JPEG, PNG, WebP or PDF receipts are allowed'));
    cb(null, true);
}
module.exports = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
