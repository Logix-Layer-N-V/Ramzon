import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, setTokenGetter } from './api';

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

  // Register token getter for axios interceptor
  useEffect(() => {
    setTokenGetter(() => accessToken);
  }, [accessToken]);

  // On mount: try to restore session via refresh token (httpOnly cookie)
  useEffect(() => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      setIsLoading(false);
      return;
    }
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
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      setAccessToken('mock-token');
      setUser({ id: '1', role: 'Admin', name: email.split('@')[0] });
      return;
    }
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
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
