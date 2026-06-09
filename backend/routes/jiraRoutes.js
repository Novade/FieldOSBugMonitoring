const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getBugs, getRegressions } = require('../controllers/jiraController');

router.get('/bugs', requireAuth, getBugs);
router.get('/regressions', requireAuth, getRegressions);

module.exports = router;
