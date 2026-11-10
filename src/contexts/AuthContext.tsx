import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Account, Role } from '../types';
import { normalizeLoginName, readAdminAccounts, recordDemoLogin } from '../pages/Admin';

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
    const loginName = normalizeLoginName(username);
    const acc = readAdminAccounts().find((a) => normalizeLoginName(a.username) === loginName || normalizeLoginName(a.name) === loginName);
    const accountName = acc?.username ?? loginName;
    if ((JSON.parse(window.localStorage.getItem('bepkho.admin.locked') || '[]') as string[]).includes(accountName)) { recordDemoLogin({username: accountName, at: new Date().toISOString(), status: 'Bị khóa'}); return 'Tài khoản đã bị khóa'; }
    if (!acc) { recordDemoLogin({username: loginName, at: new Date().toISOString(), status: 'Thất bại'}); return 'Tài khoản không tồn tại'; }
    if (acc.password !== password) { recordDemoLogin({username: acc.username, role: acc.role, at: new Date().toISOString(), status: 'Thất bại'}); return 'Mật khẩu không đúng'; }
    recordDemoLogin({username: acc.username, role: acc.role, at: new Date().toISOString(), status: 'Thành công'});
    const session = { username: acc.username, name: acc.name, role: acc.role };
    setUser(session);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    const loginId=`LOGIN-${Date.now()}`; window.localStorage.setItem('bepkho.activeLoginId',loginId);
    try { const events=JSON.parse(window.localStorage.getItem('bepkho.loginHistory')||'[]') as Record<string,unknown>[]; const staff=JSON.parse(window.localStorage.getItem('bepkho.staffProfiles')||'{}') as Record<string,{employeeId?:string;department?:string}>; events.unshift({id:loginId,username:acc.username,role:acc.role,name:acc.name,employeeId:staff[acc.username]?.employeeId??acc.username,department:staff[acc.username]?.department??acc.role,at:new Date().toISOString(),status:'Thành công'}); localStorage.setItem('bepkho.loginHistory',JSON.stringify(events.slice(0,2000))); } catch { /* local demo storage */ }
    return null;
  }, []);

  const logout = useCallback(() => {
    const activeId=window.localStorage.getItem('bepkho.activeLoginId');
    if(activeId){try{const events=JSON.parse(window.localStorage.getItem('bepkho.loginHistory')||'[]') as Record<string,unknown>[];const event=events.find(e=>e.id===activeId);if(event){event.logoutAt=new Date().toISOString();localStorage.setItem('bepkho.loginHistory',JSON.stringify(events));}}catch{/* local demo storage */}window.localStorage.removeItem('bepkho.activeLoginId');}
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
  Admin: '/admin/accounts',
  'Quản lý': '/',
  'Nhân viên kho': '/inventory',
  'Phục vụ': '/tables',
  Bếp: '/kitchen',
  'Thu ngân': '/tables',
  'Kế toán': '/accountant'
};
