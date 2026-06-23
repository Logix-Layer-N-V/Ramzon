import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, setTokenGetter, setTokenSetter } from './api';

interface AuthUser {
  id: string;
  role: 'Admin' | 'Sales' | 'Accountant';
  name: string;
}

interface AuthCtx {
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Register token getter/setter for axios interceptor
  useEffect(() => {
    setTokenGetter(() => accessToken);
    setTokenSetter(setAccessToken);
  }, [accessToken]);

  // On mount: try to restore session via refresh token (httpOnly cookie)
  useEffect(() => {
    api.post('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return api.get('/auth/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
      })
      .then(({ data }) => setUser(data.user))
      .catch(() => { /* no session */ })
      .finally(() => setIsLoading(false));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAccessToken(data.accessToken);
      setUser(data.user);
    } catch (err: any) {
      // Dev fallback: only when VITE_ENABLE_DEV_LOGIN=true is set AND password is 'devmode'
      if (
        import.meta.env.DEV &&
        import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true' &&
        password === 'devmode' &&
        (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNREFUSED')
      ) {
        setAccessToken('dev-token');
        setUser({ id: 'dev', role: 'Admin', name: email.split('@')[0] });
        return;
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      login,
      logout,
      isAuthenticated: !!user,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
