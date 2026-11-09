import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken, setAuthLostHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);

const EMPTY = { status: 'loading', user: null, profile: null, application: null, admin: null };
const ANON = { ...EMPTY, status: 'anon' };

export const homePathFor = (user) => (user?.role === 'admin' ? '/admin' : '/app');

const fromResponse = (data) => ({
  status: 'authed',
  user: data.user,
  profile: data.profile || null,
  application: data.application || null,
  admin: data.admin || null,
});

export function AuthProvider({ children }) {
  const [state, setState] = useState(EMPTY);

  const clear = useCallback(() => {
    setAccessToken(null);
    tokenStore.clear();
    setState(ANON);
  }, []);

  // Restore the session on page load: /auth/me triggers a silent token refresh when needed.
  useEffect(() => {
    setAuthLostHandler(clear);
    if (!tokenStore.refresh) {
      setState(ANON);
      return;
    }
    api.get('/auth/me').then(
      (data) => setState(fromResponse(data)),
      (err) => {
        if (err.status === 0) setState(ANON); // offline: show the public site, token kept for next time
        else clear();
      },
    );
  }, [clear]);

  const startSession = useCallback((data, remember) => {
    setAccessToken(data.access_token);
    tokenStore.set(data.refresh_token, remember);
    setState(fromResponse(data));
    return data.user;
  }, []);

  const login = useCallback(
    async (email, password, remember) =>
      startSession(await api.post('/auth/login', { email, password }, { auth: false }), remember),
    [startSession],
  );

  const register = useCallback(
    async (payload) => startSession(await api.post('/auth/register', payload, { auth: false }), false),
    [startSession],
  );

  const logout = useCallback(async () => {
    const refresh_token = tokenStore.refresh;
    try {
      await api.post('/auth/logout', refresh_token ? { refresh_token } : undefined);
    } catch {
      /* the local session is cleared regardless */
    }
    clear();
  }, [clear]);

  const refreshMe = useCallback(async () => {
    const data = await api.get('/auth/me');
    setState(fromResponse(data));
    return data;
  }, []);

  const value = useMemo(
    () => ({ ...state, login, register, logout, refreshMe, endSession: clear }),
    [state, login, register, logout, refreshMe, clear],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
