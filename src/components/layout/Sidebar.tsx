import { NavLink } from 'react-router-dom';
import { ClipboardListIcon, LogOutIcon } from 'lucide-react';
import { useMetrics } from '../../hooks/useMetrics';
import { useAuth } from '../../contexts/AuthContext';
import { navGroups, type BadgeKey } from '../../data/navigation';

interface SidebarProps {
  mobileOpen: boolean;
  onNavigate: () => void;
}

const BADGE_TONE: Record<BadgeKey, string> = {
  kitchen: 'bg-brand-100 text-brand-700',
  cashier: 'bg-emerald-100 text-emerald-700',
  nearExpiry: 'bg-amber-100 text-amber-800',
  expired: 'bg-red-100 text-red-700'
};

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  const m = useMetrics();
  const { user, logout } = useAuth();

  const badgeValue: Record<BadgeKey, number> = {
    kitchen: m.kitchenLines.length,
    cashier: m.openOrders.length,
    nearExpiry: m.nearExpiry.length,
    expired: m.expired.length
  };

  const groups = navGroups.
  map((g) => ({
    ...g,
    items: g.items.filter((i) => user && i.roles.includes(user.role))
  })).
  filter((g) => g.items.length > 0);

  return (
    <>
    {mobileOpen && <button aria-label="Đóng menu" onClick={onNavigate} className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px] md:hidden" />}
    <aside className={`app-sidebar fixed inset-y-0 left-0 z-40 flex h-full w-[min(82vw,18rem)] shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 md:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-900/40">
          <ClipboardListIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight tracking-wide text-white">
            BếpKho
          </p>
          <p className="mt-1 text-[11px] leading-tight text-slate-400">
            Nhà hàng Sen Vàng
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin px-3 pb-6">
        {groups.map((g) =>
        <div key={g.title} className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {g.title}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
              const count = item.badge ? badgeValue[item.badge] : 0;
              return (
                <li key={item.to}>
                    <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors duration-150 ease-out ${
                    isActive ?
                    'bg-brand-500/15 font-semibold text-blue-200 ring-1 ring-inset ring-brand-400/20' :
                    'text-slate-300 hover:bg-white/5 hover:text-white'}`

                    }>
                    
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && count > 0 &&
                    <span
                      className={`tabular rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${BADGE_TONE[item.badge]}`}>
                      
                          {count}
                        </span>
                    }
                    </NavLink>
                  </li>);

            })}
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors duration-150 ease-out hover:bg-white/5 hover:text-white">
          
          <LogOutIcon className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
    </>);

}
