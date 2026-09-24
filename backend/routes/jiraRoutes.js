const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getBugs, getWorkspaceNames } = require('../controllers/jiraController');

router.get('/bugs', requireAuth, getBugs);
router.get('/workspaces', requireAuth, getWorkspaceNames);

module.exports = router;
