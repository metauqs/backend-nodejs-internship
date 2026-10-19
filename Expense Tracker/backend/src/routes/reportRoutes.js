const router = require('express').Router();
const c = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');
router.use(auth);
router.get('/monthly', c.monthly);
router.post('/email-summary', c.emailSummary);
module.exports = router;
