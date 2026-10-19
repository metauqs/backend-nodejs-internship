const router = require('express').Router();
const c = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');
router.use(auth);
router.get('/summary', c.summary);
router.get('/stats', c.stats);
router.get('/recent-transactions', c.recent);
module.exports = router;
