// ─── WardWatch API Client ─────────────────────────────────────────────────────
// ALL requests use the environment-provided VITE_API_BASE_URL

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("[WardWatch] CRITICAL: VITE_API_BASE_URL is not defined in the environment.");
}

// ─── Header Helper ────────────────────────────────────────────────────────────
export function getHeaders(includeAuth) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const username = localStorage.getItem('ww_username');
    const password = localStorage.getItem('ww_password');
    if (username && password) {
      headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
    }
  }

  return headers;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
export async function api(path, options = {}, includeAuth = false) {
  const headers = {
    ...getHeaders(includeAuth),
    ...(options.headers || {}),
  };

  let res;
  try {
    console.log(`[WardWatch] Fetching: ${BASE_URL}${path}`, { method: options.method || 'GET', headers });
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    console.error('[WardWatch] Network error:', err.message);
    throw new Error('Cannot reach server. Is the backend running on port 8080?');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    console.error('[WardWatch] API error:', message, data);
    throw new Error(message);
  }

  return data;
}

// ─── Auth calls ───────────────────────────────────────────────────────────────

export async function apiLogin({ username, password }) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, false);

  if (data) {
    localStorage.setItem('ww_username', username);
    localStorage.setItem('ww_password', password);
  }

  console.log('[WardWatch] Login success:', data);
  return data; // { message: "Login successful", role: "STAFF" | "ADMIN" }
}

export async function apiRegister({ username, password }) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, false);
  console.log('[WardWatch] Register success:', data);
  return data; // { message: "Registration successful", role: "STAFF" }
}
