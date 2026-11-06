import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHatIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  EyeIcon,
  EyeOffIcon,
  LayoutGridIcon,
  PackageIcon,
  ShieldCheckIcon,
  WalletIcon } from
'lucide-react';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { ROLE_HOME, useAuth } from '../contexts/AuthContext';
import { readAdminAccounts } from './Admin';
import type { Role } from '../types';

const ROLE_INFO: Record<
  Role,
  {icon: React.ComponentType<{className?: string;}>;desc: string;}> =
{
  'Quản lý': { icon: ShieldCheckIcon, desc: 'Món ăn, bàn, báo cáo, tồn kho' },
  Admin: { icon: ShieldCheckIcon, desc: 'Tài khoản và lịch sử đăng nhập' },
  'Phục vụ': { icon: LayoutGridIcon, desc: 'Sơ đồ bàn, gọi món' },
  Bếp: { icon: ChefHatIcon, desc: 'Chế biến, công thức, hao hụt' },
  'Thu ngân': { icon: WalletIcon, desc: 'Thanh toán, hóa đơn' },
  'Nhân viên kho': { icon: PackageIcon, desc: 'Nhập hàng, lô, hạn dùng' },
  'Kế toán': { icon: ClipboardCheckIcon, desc: 'Duyệt ngân sách, báo cáo' }
};

export function Login() {
  const accounts = readAdminAccounts();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = (u = username, p = password) => {
    if (!u || !p) {
      setError('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      const err = login(u, p);
      setLoading(false);
      if (err) {
        setError(err);
        return;
      }
      const acc = accounts.find((a) => a.username === u.trim().toLowerCase());
      navigate(acc ? ROLE_HOME[acc.role] : '/', { replace: true });
    }, 350);
  };

  return (
    <div className="flex min-h-full w-full bg-white">
      <div className="hidden w-[44%] flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
            <ClipboardListIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold leading-tight">BếpKho</p>
            <p className="text-xs leading-tight text-slate-400">
              Nhà hàng Sen Vàng
            </p>
          </div>
        </div>
        <div>
          <h1 className="max-w-md text-3xl font-semibold leading-tight">
            Từ lúc khách gọi món đến khi trừ kho — một luồng duy nhất.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Phục vụ gửi order, bếp chế biến, thu ngân thanh toán và hệ thống tự
            trừ nguyên liệu theo công thức, ưu tiên lô hết hạn trước.
          </p>
        </div>
        <p className="text-xs text-slate-500">© 2026 Sen Vàng Restaurant</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Đăng nhập
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Màn hình và quyền thao tác sẽ hiển thị theo vai trò của bạn.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}>
            
            <Field label="Tài khoản">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="vd: quanly"
                className={inputClass} />
              
            </Field>
            <Field label="Mật khẩu">
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••"
                  className={`${inputClass} pr-10`} />
                
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700">
                  
                  {show ?
                  <EyeOffIcon className="h-4 w-4" /> :

                  <EyeIcon className="h-4 w-4" />
                  }
                </button>
              </div>
            </Field>
            {error &&
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            }
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>

          <div className="mt-10">
            <p className="text-xs font-medium text-slate-500">
              Tài khoản demo — mật khẩu <span className="font-mono">123456</span>
            </p>
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {accounts.map((a) => {
                const info = ROLE_INFO[a.role];
                return (
                  <li key={a.username}>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername(a.username);
                        setPassword(a.password);
                        submit(a.username, a.password);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-slate-50">
                      
                      <info.icon className="h-4 w-4 text-slate-500" />
                      <span className="w-28 text-sm font-medium text-slate-900">
                        {a.role}
                      </span>
                      <span className="flex-1 truncate text-xs text-slate-500">
                        {info.desc}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {a.username}
                      </span>
                    </button>
                  </li>);

              })}
            </ul>
          </div>
        </div>
      </div>
    </div>);

}
