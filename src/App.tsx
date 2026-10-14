import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, ROLE_HOME, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
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

const ROUTES: {path: string;guard: string;element: React.ReactNode;}[] = [
{ path: '/', guard: '/', element: <Dashboard /> },
{ path: '/tables', guard: '/tables', element: <Tables /> },
{ path: '/order/:tableId', guard: '/order', element: <OrderPage /> },
{ path: '/kitchen', guard: '/kitchen', element: <Kitchen /> },
{ path: '/cashier', guard: '/cashier', element: <Cashier /> },
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


function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>);

  }

  const home = ROLE_HOME[user.role];

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