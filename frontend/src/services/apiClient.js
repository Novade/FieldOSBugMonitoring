import axios from 'axios';

// Shared axios instance for every backend call: sends the session cookie and
// sends the user back to /login when the session has expired.
export const api = axios.create({ withCredentials: true });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export function extractError(err) {
  return err.response?.data?.error || err.message || 'Unknown error';
}

// Runs an axios call and returns its body, turning failures into an Error
// carrying the backend's message.
export async function request(fn) {
  try {
    const res = await fn();
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = {};

// Shares one promise per key for CACHE_TTL; a failed call is dropped so the next one retries.
export function withCache(key, fn) {
  const now = Date.now();
  if (cache[key] && now - cache[key].ts < CACHE_TTL) {
    return cache[key].promise;
  }
  const promise = fn();
  cache[key] = { promise, ts: now };
  promise.catch(() => {
    delete cache[key];
  });
  return promise;
}

export function clearCache(keys) {
  keys.forEach((key) => delete cache[key]);
}
