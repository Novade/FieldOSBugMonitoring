const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getSummary, getRepos, getOpenPRs, getProgress } = require('../controllers/githubController');

const router = express.Router();

router.get('/summary', requireAuth, getSummary);
router.get('/repos', requireAuth, getRepos);
router.get('/open-prs', requireAuth, getOpenPRs);
router.get('/progress', requireAuth, getProgress);

module.exports = router;
