import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Account, Role } from '../types';
import { accounts } from '../data/seed';

type SessionUser = Omit<Account, 'password'>;

interface AuthState {
  user: SessionUser | null;
  login: (username: string, password: string) => string | null;
  logout: () => void;
}

const STORAGE_KEY = 'bepkho.session';

const Ctx = createContext<AuthState | null>(null);

function readSession(): SessionUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as SessionUser : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<SessionUser | null>(readSession);

  const login = useCallback((username: string, password: string) => {
    const acc = accounts.find(
      (a) => a.username === username.trim().toLowerCase()
    );
    if (!acc) return 'Tài khoản không tồn tại';
    if (acc.password !== password) return 'Mật khẩu không đúng';
    const session = { username: acc.username, name: acc.name, role: acc.role };
    setUser(session);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>);

}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const ROLE_HOME: Record<Role, string> = {
  'Quản lý': '/',
  'Nhân viên kho': '/inventory',
  'Phục vụ': '/tables',
  Bếp: '/kitchen',
  'Thu ngân': '/cashier'
};