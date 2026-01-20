const express = require('express');
const proxyRequest = require('../services/proxy');
const { authServiceUrl } = require('../config/env');

const router = express.Router();

router.all('/auth/*', (req, res) => {
  proxyRequest(req, res, authServiceUrl);
});

module.exports = router;
