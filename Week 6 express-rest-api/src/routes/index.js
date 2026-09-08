const express = require('express');
const productRoutes = require('./product.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy', uptime: process.uptime() });
});

router.use('/products', productRoutes);

module.exports = router;
