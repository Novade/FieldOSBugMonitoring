const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getSummary,
  getRepos,
  getOpenPRs,
  getProgress,
  retryRepo,
  getBranches,
  getPRsByBranch,
} = require('../controllers/githubController');

const router = express.Router();

router.get('/summary', requireAuth, getSummary);
router.get('/repos', requireAuth, getRepos);
router.get('/open-prs', requireAuth, getOpenPRs);
router.get('/progress', requireAuth, getProgress);
router.post('/repos/:repo/retry', requireAuth, retryRepo);
router.get('/branches', requireAuth, getBranches);
router.get('/prs', requireAuth, getPRsByBranch);

module.exports = router;
