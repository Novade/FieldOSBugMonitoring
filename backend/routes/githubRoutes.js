const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getSummary, getRepos, getOpenPRs, getProgress, retryRepo } = require('../controllers/githubController');

const router = express.Router();

router.get('/summary', requireAuth, getSummary);
router.get('/repos', requireAuth, getRepos);
router.get('/open-prs', requireAuth, getOpenPRs);
router.get('/progress', requireAuth, getProgress);
router.post('/repos/:repo/retry', requireAuth, retryRepo);

module.exports = router;
