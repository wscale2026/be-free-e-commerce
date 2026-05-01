import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserRole, AuthUser } from '@/types';
import api from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  login: (credentials: { username: string; password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('befree_auth');
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const role = user?.role ?? null;

  // Verify auth layer when user loads the app
  useEffect(() => {
    const verifyMe = async () => {
      try {
        const response = await api.get('/auth/me/');
        const userData = response.data;
        const mappedUser: AuthUser = {
          id: String(userData.id),
          username: userData.username || '',
          firstName: userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          email: userData.email,
          role: userData.role as UserRole,
        };
        setUser(mappedUser);
        localStorage.setItem('befree_auth', JSON.stringify(mappedUser));
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyMe();
  }, []);

  const login = useCallback(async (credentials: { username: string; password?: string }) => {
    const response = await api.post('/auth/login/', credentials);
    const userData = response.data.user;
    const mappedUser: AuthUser = {
      id: String(userData.id),
      username: userData.username || '',
      firstName: userData.first_name || '',
      lastName: userData.lastName || userData.last_name || '',
      email: userData.email,
      role: userData.role as UserRole,
    };
    setUser(mappedUser);
    localStorage.setItem('befree_auth', JSON.stringify(mappedUser));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout/');
    } catch {} // Ignore error if session is already dead
    setUser(null);
    localStorage.removeItem('befree_auth');
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
