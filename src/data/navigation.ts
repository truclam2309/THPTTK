import type React from 'react';
import {
  AlertTriangleIcon,
  BarChart3Icon,
  BookOpenIcon,
  BoxesIcon,
  ChefHatIcon,
  CoinsIcon,
  ClipboardCheckIcon,
  FlameIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  PackageIcon,
  PackagePlusIcon,
  ReceiptTextIcon,
  SearchIcon,
  ScrollTextIcon,
  SettingsIcon,
  TimerIcon,
  Trash2Icon,
  TrendingUpIcon,
  TruckIcon,
  UtensilsCrossedIcon,
  WalletIcon } from
'lucide-react';
import type { Role } from '../types';

export type BadgeKey = 'kitchen' | 'cashier' | 'nearExpiry' | 'expired';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{className?: string;}>;
  roles: Role[];
  badge?: BadgeKey;
}

const QL: Role = 'Quản lý';
const KHO: Role = 'Nhân viên kho';
const PV: Role = 'Phục vụ';
const BEP: Role = 'Bếp';
const TN: Role = 'Thu ngân';
const KT: Role = 'Kế toán';
const ADMIN: Role = 'Admin';

export const navGroups: {title: string;items: NavItem[];}[] = [
{
  title: 'Vận hành',
  items: [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, roles: [QL] },
  { to: '/tables', label: 'Sơ đồ bàn', icon: LayoutGridIcon, roles: [QL, PV] },
  { to: '/order-status', label: 'Theo dõi món ăn', icon: TimerIcon, roles: [PV] },
  { to: '/kitchen', label: 'Bếp', icon: ChefHatIcon, roles: [BEP], badge: 'kitchen' },
  { to: '/cashier', label: 'Thu ngân', icon: WalletIcon, roles: [TN], badge: 'cashier' },
  { to: '/invoices', label: 'Lịch sử hóa đơn', icon: ScrollTextIcon, roles: [QL, TN] }]

},
{
  title: 'Thực đơn',
  items: [
  { to: '/dishes', label: 'Quản lý món ăn', icon: UtensilsCrossedIcon, roles: [QL] },
  { to: '/recipes', label: 'Công thức', icon: BookOpenIcon, roles: [QL, BEP] },
  { to: '/specials', label: 'Món đặc biệt', icon: FlameIcon, roles: [QL] }]

},
{
  title: 'Kho nguyên liệu',
  items: [
  { to: '/inventory', label: 'Tồn kho', icon: PackageIcon, roles: [KHO] },
  { to: '/warehouse/requests', label: 'Đề nghị nhập kho', icon: PackagePlusIcon, roles: [KHO] },
  { to: '/warehouse/stocktake', label: 'Biên bản kiểm kê', icon: ClipboardCheckIcon, roles: [KHO] },
  { to: '/receive', label: 'Nhập hàng', icon: PackagePlusIcon, roles: [KHO] },
  { to: '/batches', label: 'Lô hàng', icon: BoxesIcon, roles: [KHO] },
  { to: '/expiry', label: 'Hạn sử dụng', icon: TimerIcon, roles: [KHO], badge: 'nearExpiry' },
  { to: '/expired', label: 'Hàng hết hạn', icon: AlertTriangleIcon, roles: [KHO], badge: 'expired' },
  { to: '/disposal', label: 'Hủy / Hao hụt', icon: Trash2Icon, roles: [KHO] },
  { to: '/suppliers', label: 'Nhà cung cấp', icon: TruckIcon, roles: [KHO] }]

},
{
  title: 'Tài chính',
  items: [
  { to: '/accountant', label: 'Tổng quan kế toán', icon: ClipboardCheckIcon, roles: [KT] },
  { to: '/accountant/revenue', label: 'Theo dõi doanh thu', icon: ReceiptTextIcon, roles: [KT] },
  { to: '/accountant/cash-vouchers', label: 'Phiếu thu, chi', icon: ReceiptTextIcon, roles: [KT] },
  { to: '/accountant/costs', label: 'Theo dõi chi phí', icon: CoinsIcon, roles: [KT] },
  { to: '/accountant/lookup', label: 'Tra cứu doanh thu, chi phí', icon: SearchIcon, roles: [KT] },
  { to: '/accountant/requests', label: 'Duyệt đề nghị', icon: PackagePlusIcon, roles: [KT] },
  { to: '/manager/requests', label: 'Phê duyệt đề nghị nhập kho', icon: PackagePlusIcon, roles: [QL] },
  { to: '/manager/attendance', label: 'Chấm công', icon: ClipboardCheckIcon, roles: [QL] },
  { to: '/accountant/reconciliation', label: 'Đối chiếu ngân sách', icon: CoinsIcon, roles: [KT] },
  { to: '/accountant/reports', label: 'Báo cáo tài chính', icon: BarChart3Icon, roles: [KT] },
  { to: '/finance/revenue', label: 'Doanh thu', icon: ReceiptTextIcon, roles: [QL] },
  { to: '/finance/cost', label: 'Chi phí', icon: CoinsIcon, roles: [QL] },
  { to: '/finance/profit', label: 'Lợi nhuận', icon: TrendingUpIcon, roles: [QL] },
  { to: '/reports', label: 'Báo cáo', icon: BarChart3Icon, roles: [QL, KHO, TN] }]

},
{
  title: 'Hệ thống',
  items: [
  { to: '/admin/accounts', label: 'Tài khoản nhân viên', icon: SettingsIcon, roles: [ADMIN] },
  { to: '/admin/logins', label: 'Lịch sử đăng nhập', icon: HistoryIcon, roles: [ADMIN] },
  { to: '/history', label: 'Lịch sử kho', icon: HistoryIcon, roles: [QL, KHO] },
  { to: '/settings', label: 'Cài đặt', icon: SettingsIcon, roles: [QL] }]

}];


/** Quyền truy cập theo route (bao gồm route không có trên menu) */
export const routeRoles: Record<string, Role[]> = {
  ...Object.fromEntries(
    navGroups.flatMap((g) => g.items.map((i) => [i.to, i.roles]))
  ),
  '/order': [PV],
  '/finance': [QL],
  '/accountant': [KT],
  '/accountant/requests': [KT],
  '/manager/requests': [QL],
  '/manager/attendance': [QL],
  '/accountant/reconciliation': [KT],
  '/accountant/reports': [KT]
  ,'/accountant/revenue': [KT]
  ,'/accountant/cash-vouchers': [KT]
  ,'/accountant/costs': [KT]
  ,'/accountant/lookup': [KT]
  ,'/admin/accounts': [ADMIN],
  '/admin/logins': [ADMIN],
  '/order-status': [PV],
  '/warehouse/requests': [KHO],
  '/warehouse/stocktake': [KHO]
};
