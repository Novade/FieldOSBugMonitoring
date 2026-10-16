const { createGithubJsonStore } = require('./githubJsonStore');
const { storage } = require('../config/escapeRate');

module.exports = createGithubJsonStore({ ...storage, label: 'escape rate' });
