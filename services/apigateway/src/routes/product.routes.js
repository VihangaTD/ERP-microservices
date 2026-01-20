const express = require('express');
const authMiddleware = require('../middleware/auth');
const proxyRequest = require('../services/proxy');
const { productServiceUrl } = require('../config/env');

const router = express.Router();

// Protect all product routes
router.use(authMiddleware);

router.all(['/products', '/products/*', '/stock', '/stock/*'], (req, res) => {
  proxyRequest(req, res, productServiceUrl);
});

module.exports = router;

