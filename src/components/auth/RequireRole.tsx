import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlertIcon } from 'lucide-react';
import { ROLE_HOME, useAuth } from '../../contexts/AuthContext';
import { routeRoles } from '../../data/navigation';
import { Button } from '../ui/Button';

export function RequireRole({
  path,
  children



}: {path: string;children: React.ReactNode;}) {
  const { user } = useAuth();
  const allowed = routeRoles[path];
  if (!user) return null;
  if (allowed && !allowed.includes(user.role)) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <ShieldAlertIcon className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Không có quyền truy cập
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vai trò <strong>{user.role}</strong> không được phép mở màn hình
            này.
          </p>
          <Link to={ROLE_HOME[user.role]} className="mt-5 inline-block">
            <Button>Về màn hình của tôi</Button>
          </Link>
        </div>
      </div>);

  }
  return <>{children}</>;
}