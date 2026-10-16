const axios = require('axios');
const config = require('../config/env');

// A JSON file on a GitHub data branch, read and written through the Contents API.
// Every write is a commit, so the branch history is the audit log. Used instead of
// a database: the Container App's disk is wiped on every deploy.
const ghClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `Bearer ${config.github.token}`,
    Accept: 'application/vnd.github+json',
  },
  timeout: 20_000,
});

const MAX_WRITE_ATTEMPTS = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// `label` names the data in error messages, e.g. "escape rate".
function createGithubJsonStore({ repo, path, branch, label }) {
  const filePath = `/repos/${config.github.org}/${repo}/contents/${path}`;

  function storeError(err, action) {
    const status = err.response?.status;
    let message = `Could not ${action} ${label} data on GitHub.`;
    if (status === 401) message = 'GitHub authentication failed. Check GITHUB_TOKEN.';
    else if (status === 403) message = 'GITHUB_TOKEN needs Contents: Read and write permission on this repo.';
    else if (status === 404 && action === 'save')
      message = `GitHub data branch "${branch}" not found. Create it first.`;
    const wrapped = new Error(message);
    wrapped.isStoreError = true;
    wrapped.status = 502;
    return wrapped;
  }

  async function readAll() {
    try {
      const res = await ghClient.get(filePath, { params: { ref: branch } });
      const json = Buffer.from(res.data.content, 'base64').toString('utf8');
      return { entries: JSON.parse(json || '[]'), sha: res.data.sha };
    } catch (err) {
      if (err.response?.status === 404) return { entries: [], sha: undefined };
      throw storeError(err, 'load');
    }
  }

  async function writeAll(entries, sha, message) {
    const content = Buffer.from(`${JSON.stringify(entries, null, 2)}\n`).toString('base64');
    await ghClient.put(filePath, { message, content, sha, branch });
  }

  // Reads the latest entries, applies `mutate` and commits the result. A 409 means
  // the file changed since it was read (another save, or GitHub briefly serving the
  // previous version right after a commit), so it waits a little, re-reads and retries.
  // `mutate` may return null to skip the commit when nothing changed.
  async function update(mutate, message) {
    for (let attempt = 1; ; attempt++) {
      const { entries, sha } = await readAll();
      const next = mutate(entries);
      if (next === null) return entries;
      try {
        await writeAll(next, sha, message);
        return next;
      } catch (err) {
        if (err.response?.status === 409 && attempt < MAX_WRITE_ATTEMPTS) {
          await sleep(500 * attempt);
          continue;
        }
        throw storeError(err, 'save');
      }
    }
  }

  return { readAll, update };
}

module.exports = { createGithubJsonStore };
