const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');

async function initiateOAuth(req, res, next) {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;

    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: config.atlassian.clientId,
      scope: 'read:jira-work read:jira-user read:me offline_access',
      redirect_uri: config.atlassian.callbackUrl,
      state,
      response_type: 'code',
      prompt: 'consent',
    });

    res.redirect(`${config.atlassian.authUrl}?${params.toString()}`);
  } catch (err) {
    next(err);
  }
}

async function handleCallback(req, res, next) {
  const { code, state, error, error_description } = req.query;

  try {
    if (error) {
      const err = new Error(
        error_description || 'Atlassian OAuth was denied or cancelled.'
      );
      err.isOAuthError = true;
      err.status = 401;
      throw err;
    }

    if (!code) {
      const err = new Error('No authorization code received from Atlassian.');
      err.isOAuthError = true;
      err.status = 400;
      throw err;
    }

    if (state !== req.session.oauthState) {
      const err = new Error(
        'OAuth state mismatch. Please try logging in again.'
      );
      err.isOAuthError = true;
      err.status = 400;
      throw err;
    }
    delete req.session.oauthState;

    // Exchange code for tokens
    const tokenRes = await axios.post(
      config.atlassian.tokenUrl,
      {
        grant_type: 'authorization_code',
        client_id: config.atlassian.clientId,
        client_secret: config.atlassian.clientSecret,
        code,
        redirect_uri: config.atlassian.callbackUrl,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { access_token } = tokenRes.data;

    // Verify user has access to our Jira site
    const resourcesRes = await axios.get(config.atlassian.resourcesUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
      },
    });

    const sites = resourcesRes.data;
    const ourSite = sites.find((s) => s.id === config.jira.cloudId);
    if (!ourSite) {
      const err = new Error(
        'Your Atlassian account does not have access to the Novade Jira site. Contact your administrator.'
      );
      err.isOAuthError = true;
      err.status = 403;
      throw err;
    }

    // Get user profile
    const meRes = await axios.get('https://api.atlassian.com/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
      },
    });

    const { account_id, email, name, picture } = meRes.data;

    req.session.user = {
      accountId: account_id,
      email: email || '',
      displayName: name || email || 'User',
      avatarUrl: picture || '',
    };

    res.redirect(config.isDev ? config.frontendUrl : '/');
  } catch (err) {
    const detail = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error('[auth] OAuth callback error:', detail);

    const clientMsg = err.isOAuthError
      ? err.message
      : config.isDev
      ? `Login failed: ${detail}`
      : 'Login failed. Please try again.';

    const loginPath = `/login?error=${encodeURIComponent(clientMsg)}`;
    res.redirect(config.isDev ? `${config.frontendUrl}${loginPath}` : loginPath);
  }
}

function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
}

function getSession(req, res) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user: req.session.user });
}

module.exports = { initiateOAuth, handleCallback, logout, getSession };
