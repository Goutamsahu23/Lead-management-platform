'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest, clearSession, getStoredUser, getToken, setSession } from './api';
import type { Role, User } from './types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: (nextUser: User) => void;
  isAdmin: boolean;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser<User>();

    if (!storedToken || !storedUser) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    setUser(storedUser);

    apiRequest<{ user: User }>('/api/auth/me', { token: storedToken })
      .then((res) => {
        setUser(res.user);
        setSession(storedToken, res.user);
      })
      .catch(() => {
        clearSession();
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(
    (nextUser: User) => {
      const currentToken = getToken();
      if (currentToken) {
        setSession(currentToken, nextUser);
      }
      setUser(nextUser);
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      refreshUser,
      isAdmin: user?.role === 'admin',
      hasRole: (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    }),
    [user, token, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
