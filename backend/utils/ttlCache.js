// In-memory cache with a fixed time-to-live per entry. `wrap` also shares one
// in-flight promise between concurrent callers, so a slow fetch runs only once.
function createTtlCache(ttlMs) {
  const entries = new Map();
  const inFlight = new Map();

  function get(key) {
    const hit = entries.get(key);
    if (!hit || Date.now() - hit.ts >= ttlMs) return undefined;
    return hit.value;
  }

  function set(key, value) {
    entries.set(key, { value, ts: Date.now() });
    return value;
  }

  function clear(key) {
    if (key === undefined) entries.clear();
    else entries.delete(key);
  }

  async function wrap(key, fn) {
    const cached = get(key);
    if (cached !== undefined) return cached;
    if (inFlight.has(key)) return inFlight.get(key);

    const promise = (async () => set(key, await fn()))();
    inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      inFlight.delete(key);
    }
  }

  return { get, set, clear, wrap };
}

module.exports = { createTtlCache };
