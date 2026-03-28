// ─── WardWatch API Client ─────────────────────────────────────────────────────
// ALL requests go directly to http://localhost:8080

const BASE_URL = 'http://localhost:8080';

// ─── Basic Auth helper ────────────────────────────────────────────────────────
export function getAuthHeader() {
  const username = localStorage.getItem('ww_username');
  const password = localStorage.getItem('ww_password');
  console.log("[WardWatch] Storage Check:", { username, hasPassword: !!password });
  if (!username || !password) return null;
  const header = `Basic ${btoa(`${username}:${password}`)}`;
  console.log("[WardWatch] Generated Header:", header);
  return header;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
export async function api(path, options = {}) {
  const authHeader = getAuthHeader();

  const headers = {
    'Content-Type': 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
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
  });
  console.log('[WardWatch] Login success:', data);
  return data; // { message: "Login successful", role: "STAFF" | "ADMIN" }
}

export async function apiRegister({ username, password }) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  console.log('[WardWatch] Register success:', data);
  return data; // { message: "Registration successful", role: "STAFF" }
}
