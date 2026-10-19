const router = require('express').Router();
const c = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/refresh-token', c.refresh);
router.post('/refresh', c.refresh);
router.post('/logout', auth, c.logout);
router.get('/profile', auth, c.getProfile);
router.put('/profile', auth, c.updateProfile);
router.post('/profile/avatar', auth, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'file', maxCount: 1 }]), c.uploadAvatar);
router.delete('/profile/avatar', auth, c.removeAvatar);
router.put('/change-password', auth, c.changePassword);
module.exports = router;
