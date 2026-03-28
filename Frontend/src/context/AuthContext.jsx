import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Auth Context ─────────────────────────────────────────────────────────────
// Stores: user (username), role (STAFF | ADMIN), isAuthenticated
// Credentials are persisted in localStorage for Basic Auth on API calls.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Rehydrate from localStorage on first load
  const [auth, setAuth] = useState(() => {
    const username = localStorage.getItem('ww_username');
    const role = localStorage.getItem('ww_role');
    if (username && role) {
      return { username, role, isAuthenticated: true };
    }
    return { username: null, role: null, isAuthenticated: false };
  });

  /**
   * Call after a successful login.
   * Persists credentials for Basic Auth and role for routing.
   */
  const login = useCallback((username, password, role) => {
    console.log("[WardWatch] WRITING TO STORAGE", { username, hasPassword: !!password, role });
    localStorage.setItem('ww_username', username);
    localStorage.setItem('ww_password', password); // needed for Basic Auth header
    localStorage.setItem('ww_role', role);
    setAuth({ username, role, isAuthenticated: true });
  }, []);

  /**
   * Clears all stored auth state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('ww_username');
    localStorage.removeItem('ww_password');
    localStorage.removeItem('ww_role');
    setAuth({ username: null, role: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
