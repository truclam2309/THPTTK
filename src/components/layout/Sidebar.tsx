import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDownIcon,
  ClipboardListIcon,
  LogOutIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from 'lucide-react';

import { useMetrics } from '../../hooks/useMetrics';
import { useAuth } from '../../contexts/AuthContext';
import { navGroups, type BadgeKey } from '../../data/navigation';

interface SidebarProps {
  mobileOpen: boolean;
  onNavigate: () => void;
}

const BADGE_TONE: Record<BadgeKey, string> = {
  kitchen: 'bg-blue-400/15 text-blue-200',
  cashier: 'bg-emerald-400/15 text-emerald-200',
  nearExpiry: 'bg-amber-400/15 text-amber-200',
  expired: 'bg-red-400/15 text-red-200',
};

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const metrics = useMetrics();
  const { user, logout } = useAuth();
  const location = useLocation();

  const badgeValue: Record<BadgeKey, number> = {
    kitchen: metrics.kitchenLines.length,
    cashier: metrics.openOrders.length,
    nearExpiry: metrics.nearExpiry.length,
    expired: metrics.expired.length,
  };

  const groups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => user && item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (title: string) => {
    setClosedGroups((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    );
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onNavigate}
          className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-40 flex h-full shrink-0 flex-col border-r border-slate-800 bg-[#172b4d] text-white shadow-xl shadow-slate-950/20 transition-all duration-200 md:static md:z-auto md:shadow-none ${
          collapsed ? 'w-[76px]' : 'w-[min(82vw,260px)]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div
          className={`flex min-h-[68px] items-center border-b border-white/10 ${
            collapsed ? 'justify-center px-2' : 'gap-3 px-4'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ClipboardListIcon size={20} />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold tracking-tight text-white">BếpKho</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">Nhà hàng Sen Vàng</p>
            </div>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Thu gọn menu"
              aria-label="Thu gọn menu"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white md:flex"
            >
              <PanelLeftCloseIcon size={18} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            title="Mở rộng menu"
            aria-label="Mở rộng menu"
            className="mx-auto mt-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <PanelLeftOpenIcon size={18} />
          </button>
        )}

        <nav aria-label="Điều hướng chính" className="scroll-thin flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
          {groups.map((group) => {
            const isOpen = !closedGroups.includes(group.title);
            return (
              <section key={group.title} className="mb-4">
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 transition hover:text-slate-200"
                  >
                    <span className="truncate">{group.title}</span>
                    <ChevronDownIcon size={14} className={`shrink-0 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                )}

                {(collapsed || isOpen) && (
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const count = item.badge ? badgeValue[item.badge] : 0;
                      return (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            end={item.to === '/'}
                            onClick={onNavigate}
                            title={collapsed ? item.label : undefined}
                            className={({ isActive }) => {
                              const active = item.to.includes('?')
                                ? `${location.pathname}${location.search}` === item.to
                                : isActive;
                              return `group relative flex min-h-10 items-center rounded-lg text-[13px] transition-colors ${
                                collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                              } ${active ? 'bg-blue-400/15 font-semibold text-blue-100' : 'font-medium text-slate-300 hover:bg-white/5 hover:text-white'}`;
                            }}
                          >
                            {({ isActive }) => {
                              const active = item.to.includes('?')
                                ? `${location.pathname}${location.search}` === item.to
                                : isActive;
                              return (
                                <>
                                  {active && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-blue-400" />}
                                  <item.icon size={18} className={`shrink-0 transition-colors ${active ? 'text-blue-300' : 'text-slate-400 group-hover:text-blue-200'}`} />
                                  {!collapsed && (
                                    <>
                                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                      {item.badge && count > 0 && (
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${BADGE_TONE[item.badge]}`}>{count}</span>
                                      )}
                                    </>
                                  )}
                                  {collapsed && item.badge && count > 0 && (
                                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-400 ring-2 ring-[#172b4d]" />
                                  )}
                                </>
                              );
                            }}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          {!collapsed ? (
            <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
              <LogOutIcon className="h-4 w-4" />
              Đăng xuất
            </button>
          ) : (
            <button onClick={logout} aria-label="Đăng xuất" title="Đăng xuất" className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white">
              <LogOutIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
