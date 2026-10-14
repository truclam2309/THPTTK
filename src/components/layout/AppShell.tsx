import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon } from 'lucide-react';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useApp } from '../../contexts/AppContext';

export function AppShell() {
  const { toast } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 w-full bg-slate-100">
      <Sidebar mobileOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMenuOpen((open) => !open)} />
        <main className="app-main flex-1 overflow-y-auto scroll-thin">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {toast &&
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-pop">
          
            <CheckCircle2Icon className="h-4 w-4 text-emerald-400" />
            {toast}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
