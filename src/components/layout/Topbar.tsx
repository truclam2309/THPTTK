import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon, MenuIcon, SearchIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMetrics } from '../../hooks/useMetrics';
import { countdownLabel } from '../../utils/inventory';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { ingredientOf } = useApp();
  const { user } = useAuth();
  const m = useMetrics();
  const [open, setOpen] = useState(false);
  const seesStock = user?.role === 'Quản lý' || user?.role === 'Nhân viên kho';
  const initials = (user?.name ?? '').
  split(' ').
  slice(-2).
  map((w) => w[0]).
  join('');

  const alerts = !seesStock ? [] : [
  ...m.expired.map((b) => ({
    id: b.id,
    tone: 'text-red-600',
    title: `${ingredientOf(b.ingredientId).name} — ${b.id}`,
    body: `Đã hết hạn · ${countdownLabel(b.expiryDate)}`,
    to: '/expired'
  })),
  ...m.nearExpiry.map((b) => ({
    id: b.id,
    tone: 'text-amber-600',
    title: `${ingredientOf(b.ingredientId).name} — ${b.id}`,
    body: `Sắp hết hạn · ${countdownLabel(b.expiryDate)}`,
    to: '/expiry'
  })),
  ...m.lowStock.map((i) => ({
    id: i.id,
    tone: 'text-orange-600',
    title: i.name,
    body: `Tồn dưới mức tối thiểu ${i.minStock} ${i.unit}`,
    to: '/inventory'
  }))];


  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <header className="app-topbar flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:gap-4 md:px-6">
      <button onClick={onMenuClick} aria-label="Mở menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden">
        <MenuIcon className="h-5 w-5" />
      </button>
      <div className="relative hidden max-w-md flex-1 md:block">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Tìm nguyên liệu, mã lô, mã barcode, món ăn…"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 transition-colors duration-150 ease-out focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
        
      </div>

      <p className="ml-auto hidden text-sm text-slate-500 lg:block">{today}</p>

      <div className={`relative ${seesStock ? '' : 'hidden'}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Thông báo"
          className="relative rounded-lg p-2 text-slate-500 transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-slate-800">
          
          <BellIcon className="h-5 w-5" />
          {alerts.length > 0 &&
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {alerts.length}
            </span>
          }
        </button>

        <AnimatePresence>
          {open &&
          <>
              <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)} />
            
              <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
              
                <p className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
                  Cảnh báo kho ({alerts.length})
                </p>
                <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto scroll-thin">
                  {alerts.map((a, i) =>
                <li key={`${a.id}-${i}`}>
                      <Link
                    to={a.to}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 transition-colors duration-150 ease-out hover:bg-slate-50">
                    
                        <p className="text-sm font-medium text-slate-800">
                          {a.title}
                        </p>
                        <p className={`text-xs ${a.tone}`}>{a.body}</p>
                      </Link>
                    </li>
                )}
                  {alerts.length === 0 &&
                <li className="px-4 py-6 text-center text-sm text-slate-500">
                      Không có cảnh báo
                    </li>
                }
                </ul>
              </motion.div>
            </>
          }
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium leading-tight text-slate-900">
            {user?.name}
          </p>
          <p className="text-[11px] leading-tight text-slate-500">
            {user?.role}
          </p>
        </div>
      </div>
    </header>);

}
