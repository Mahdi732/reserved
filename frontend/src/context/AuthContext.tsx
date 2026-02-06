'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { User, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = Cookies.get('token');
    const storedUser = Cookies.get('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    Cookies.set('token', access_token, { expires: 7 });
    Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    setToken(access_token);
    setUser(userData);
  };

  const register = async (email: string, name: string, password: string, role?: string) => {
    const res = await api.post<AuthResponse>('/auth/register', { email, name, password, role });
    const { access_token, user: userData } = res.data;
    Cookies.set('token', access_token, { expires: 7 });
    Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    setToken(access_token);
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
