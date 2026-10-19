const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getDeployments } = require('../controllers/deploymentController');

router.get('/', requireAuth, getDeployments);

module.exports = router;
