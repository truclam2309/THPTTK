import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, ROLE_HOME, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { AppShell } from './components/layout/AppShell';
import { RequireRole } from './components/auth/RequireRole';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tables } from './pages/Tables';
import { OrderPage } from './pages/OrderPage';
import { Kitchen } from './pages/Kitchen';
import { Cashier } from './pages/Cashier';
import { Invoices } from './pages/Invoices';
import { Inventory } from './pages/Inventory';
import { Receive } from './pages/Receive';
import { Batches } from './pages/Batches';
import { Expiry } from './pages/Expiry';
import { Specials } from './pages/Specials';
import { Expired } from './pages/Expired';
import { Disposal } from './pages/Disposal';
import { Suppliers } from './pages/Suppliers';
import { Dishes } from './pages/Dishes';
import { Recipes } from './pages/Recipes';
import { Finance } from './pages/Finance';
import { Reports } from './pages/Reports';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Accountant } from './pages/Accountant';
import { AdminAccounts, LoginHistory } from './pages/Admin';
import { OrderStatus } from './pages/OrderStatus';
import { PurchaseRequests, Stocktake } from './pages/WarehouseForms';
import { Attendance } from './pages/Attendance';
import { Payroll } from './pages/Payroll';
import { ManagerCashierShifts } from './pages/ManagerCashierShifts';
import { Debts } from './pages/Debts';
import { ExpenseTracking } from './pages/ExpenseTracking';

const ROUTES: {path: string;guard: string;element: React.ReactNode;}[] = [
{ path: '/', guard: '/', element: <Dashboard /> },
{ path: '/tables', guard: '/tables', element: <Tables /> },
{ path: '/order/:tableId', guard: '/order', element: <OrderPage /> },
{ path: '/kitchen', guard: '/kitchen', element: <Kitchen /> },
{ path: '/cashier', guard: '/cashier', element: <Cashier /> },
{ path: '/manager/cashier-shifts', guard: '/manager/cashier-shifts', element: <ManagerCashierShifts /> },
{ path: '/invoices', guard: '/invoices', element: <Invoices /> },
{ path: '/inventory', guard: '/inventory', element: <Inventory /> },
{ path: '/receive', guard: '/receive', element: <Receive /> },
{ path: '/batches', guard: '/batches', element: <Batches /> },
{ path: '/expiry', guard: '/expiry', element: <Expiry /> },
{ path: '/specials', guard: '/specials', element: <Specials /> },
{ path: '/expired', guard: '/expired', element: <Expired /> },
{ path: '/disposal', guard: '/disposal', element: <Disposal /> },
{ path: '/suppliers', guard: '/suppliers', element: <Suppliers /> },
{ path: '/dishes', guard: '/dishes', element: <Dishes /> },
{ path: '/recipes', guard: '/recipes', element: <Recipes /> },
{ path: '/finance/:tab', guard: '/finance', element: <Finance /> },
{ path: '/reports', guard: '/reports', element: <Reports /> },
{ path: '/history', guard: '/history', element: <History /> },
{ path: '/settings', guard: '/settings', element: <Settings /> }];
ROUTES.push(
{ path: '/admin/accounts', guard: '/admin/accounts', element: <AdminAccounts /> },
{ path: '/admin/logins', guard: '/admin/logins', element: <LoginHistory /> },
{ path: '/order-status', guard: '/order-status', element: <OrderStatus /> }
,{ path: '/warehouse/requests', guard: '/warehouse/requests', element: <PurchaseRequests /> },
{ path: '/warehouse/stocktake', guard: '/warehouse/stocktake', element: <Stocktake /> }
);
ROUTES.push(
{ path: '/accountant', guard: '/accountant', element: <Accountant initialTab="overview" /> },
{ path: '/accountant/requests', guard: '/accountant/requests', element: <Accountant initialTab="requests" /> },
{ path: '/manager/requests', guard: '/manager/requests', element: <Accountant initialTab="requests" /> },
{ path: '/manager/attendance', guard: '/manager/attendance', element: <Attendance /> },
{ path: '/manager/payroll', guard: '/manager/payroll', element: <Payroll /> },
{ path: '/accountant/payroll', guard: '/accountant/payroll', element: <Payroll /> },
{ path: '/accountant/reconciliation', guard: '/accountant/reconciliation', element: <Accountant initialTab="reconciliation" /> },
{ path: '/accountant/reports', guard: '/accountant/reports', element: <Accountant initialTab="reports" /> }
,{ path: '/accountant/lookup', guard: '/accountant/lookup', element: <Accountant initialTab="lookup" /> }
,{ path: '/accountant/revenue', guard: '/accountant/revenue', element: <Accountant initialTab="revenue" /> }
,{ path: '/accountant/cash-vouchers', guard: '/accountant/cash-vouchers', element: <Accountant initialTab="vouchers" /> }
,{ path: '/accountant/debts', guard: '/accountant/debts', element: <Debts /> }
,{ path: '/accountant/costs', guard: '/accountant/costs', element: <ExpenseTracking /> }
);


function AppRoutes() {
  const { user } = useAuth();
  const { cashierShifts } = useApp();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>);

  }

  const hasOpenCashierShift = user.role === 'Thu ngân' && cashierShifts.some((shift) => shift.cashier === user.name && shift.status === 'OPEN');
  const home = user.role === 'Thu ngân' ? (hasOpenCashierShift ? '/cashier' : '/cashier?screen=shift') : ROLE_HOME[user.role];

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={home} replace />} />
      <Route element={<AppShell />}>
        {ROUTES.map((r) =>
        <Route
          key={r.path}
          path={r.path}
          element={
          r.path === '/' && user.role !== 'Quản lý' ?
          <Navigate to={home} replace /> :

          <RequireRole path={r.guard}>{r.element}</RequireRole>

          } />

        )}
        <Route path="*" element={<Navigate to={home} replace />} />
      </Route>
    </Routes>);

}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>);

}
