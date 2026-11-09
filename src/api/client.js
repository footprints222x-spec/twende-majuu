// Thin fetch wrapper around the Flask API.
//
// Tokens: the short-lived access token lives only in memory. The refresh token is
// kept in sessionStorage (cleared when the tab closes) or, if the person ticks
// "Keep me signed in", localStorage. When an access token expires the client
// silently asks for a new one and retries the request once.

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const REFRESH_KEY = 'tm_refresh_token';

let accessToken = null;
let refreshInFlight = null;
let onAuthLost = () => {};

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details || null;
  }
}

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const tokenStore = {
  get refresh() {
    return safe(() => localStorage.getItem(REFRESH_KEY)) || safe(() => sessionStorage.getItem(REFRESH_KEY));
  },
  set(token, remember) {
    this.clear();
    safe(() => (remember ? localStorage : sessionStorage).setItem(REFRESH_KEY, token));
  },
  clear() {
    safe(() => localStorage.removeItem(REFRESH_KEY));
    safe(() => sessionStorage.removeItem(REFRESH_KEY));
  },
};

export const setAccessToken = (token) => {
  accessToken = token;
};
export const setAuthLostHandler = (fn) => {
  onAuthLost = fn;
};

function toApiError(res, body) {
  const err = body && body.error;
  if (err) return new ApiError(res.status, err.code, err.message, err.details);
  if (res.status === 413) return new ApiError(413, 'payload_too_large', 'That file is too large to upload.');
  return new ApiError(res.status, 'http_error', `Something went wrong (error ${res.status}). Please try again.`);
}

async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refresh = tokenStore.refresh;
      if (!refresh) throw new ApiError(401, 'no_session', 'Please log in.');
      let res;
      try {
        res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${refresh}` } });
      } catch {
        throw new ApiError(0, 'network', 'Cannot reach the server. Check your connection and try again.');
      }
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw toApiError(res, body);
      accessToken = body.data.access_token;
      return accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

const RETRYABLE_AUTH_CODES = new Set(['token_expired', 'authorization_required', 'invalid_token']);

async function request(method, path, { params, json, form, blob = false, auth = true } = {}, retried = false) {
  let url = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const text = qs.toString();
    if (text) url += `?${text}`;
  }

  // A page reload has a refresh token but no access token yet: get one first instead of
  // sending a request that is certain to be rejected.
  if (auth && !accessToken && tokenStore.refresh && !retried) {
    try {
      await refreshAccessToken();
    } catch (refreshError) {
      if (refreshError.status === 401) {
        onAuthLost();
        throw new ApiError(401, 'no_session', 'Please log in.');
      }
      throw refreshError;
    }
  }

  const headers = {};
  let body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) {
    body = form; // the browser sets the multipart boundary itself
  }
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res;
  try {
    res = await fetch(url, { method, headers, body });
  } catch {
    throw new ApiError(0, 'network', 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.ok) {
    if (blob) return res.blob();
    const payload = await res.json().catch(() => null);
    return payload ? payload.data : undefined;
  }

  const payload = await res.json().catch(() => null);
  const error = toApiError(res, payload);

  if (res.status === 401 && auth && !retried && tokenStore.refresh && RETRYABLE_AUTH_CODES.has(error.code)) {
    try {
      await refreshAccessToken();
    } catch (refreshError) {
      if (refreshError.status === 401) onAuthLost();
      throw refreshError.status === 0 ? refreshError : error;
    }
    return request(method, path, { params, json, form, blob, auth }, true);
  }
  if (res.status === 401 && auth && ['token_revoked', 'unauthorized'].includes(error.code)) onAuthLost();
  throw error;
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, json, opts) => request('POST', path, { json, ...opts }),
  patch: (path, json) => request('PATCH', path, { json }),
  put: (path, json) => request('PUT', path, { json }),
  delete: (path) => request('DELETE', path),
  upload: (path, form) => request('POST', path, { form }),
  blob: (path) => request('GET', path, { blob: true }),
};

/** Fetch a protected file with the login token and hand it to the browser as a download. */
export async function downloadFile(path, filename) {
  const blob = await api.blob(path);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'document';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
