const express = require('express');
const router = express.Router();
const { initiateOAuth, handleCallback, logout, getSession, devLogin } = require('../controllers/authController');

router.get('/atlassian', initiateOAuth);
router.get('/callback', handleCallback);
router.delete('/logout', logout);
router.get('/session', getSession);
router.get('/dev-login', devLogin); // only works in development

module.exports = router;
