const router = require('express').Router();
const c = require('../controllers/transactionController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { requireObjectId } = require('../middleware/validateMiddleware');
router.use(auth);
router.get('/', c.list);
router.get('/all', c.all);
router.post('/', c.create);
router.post('/:id/receipt', requireObjectId('id'), upload.fields([{
        name: 'receipt',
        maxCount: 1
    }, {
        name: 'file',
        maxCount: 1
    }]), (req, res, next) => {
    req.file = req.files?.receipt?.[0] || req.files?.file?.[0];
    next();
}, c.receipt);
router.get('/:id', requireObjectId('id'), c.get);
router.put('/:id', requireObjectId('id'), c.update);
router.delete('/:id', requireObjectId('id'), c.remove);
module.exports = router;
