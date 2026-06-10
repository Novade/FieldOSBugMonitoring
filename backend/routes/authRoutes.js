const express = require('express');
const router = express.Router();
const {
  initiateOAuth,
  handleCallback,
  logout,
  getSession,
} = require('../controllers/authController');

router.get('/atlassian', initiateOAuth);
router.get('/callback', handleCallback);
router.delete('/logout', logout);
router.get('/session', getSession);

module.exports = router;
