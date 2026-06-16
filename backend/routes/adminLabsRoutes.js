const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getMonitors, getHistory, getDaily } = require('../controllers/adminLabsController');

router.get('/monitors', requireAuth, getMonitors);
router.get('/history',  requireAuth, getHistory);
router.get('/daily',    requireAuth, getDaily);

module.exports = router;
