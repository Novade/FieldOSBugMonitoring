const { createGithubJsonStore } = require('./githubJsonStore');
const { storage } = require('../config/azureDevOps');

module.exports = createGithubJsonStore({
  ...storage,
  label: 'deployment',
  empty: { runs: [] },
});
