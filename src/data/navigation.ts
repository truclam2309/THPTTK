import type React from 'react';
import {
  AlertTriangleIcon,
  BarChart3Icon,
  BookOpenIcon,
  BoxesIcon,
  ChefHatIcon,
  CoinsIcon,
  FlameIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  PackageIcon,
  PackagePlusIcon,
  ReceiptTextIcon,
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

export const navGroups: {title: string;items: NavItem[];}[] = [
{
  title: 'Vận hành',
  items: [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, roles: [QL] },
  { to: '/tables', label: 'Sơ đồ bàn', icon: LayoutGridIcon, roles: [QL, PV] },
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
  { to: '/finance/revenue', label: 'Doanh thu', icon: ReceiptTextIcon, roles: [QL] },
  { to: '/finance/cost', label: 'Chi phí', icon: CoinsIcon, roles: [QL] },
  { to: '/finance/profit', label: 'Lợi nhuận', icon: TrendingUpIcon, roles: [QL] },
  { to: '/reports', label: 'Báo cáo', icon: BarChart3Icon, roles: [QL, KHO, TN] }]

},
{
  title: 'Hệ thống',
  items: [
  { to: '/history', label: 'Lịch sử kho', icon: HistoryIcon, roles: [QL, KHO] },
  { to: '/settings', label: 'Cài đặt', icon: SettingsIcon, roles: [QL] }]

}];


/** Quyền truy cập theo route (bao gồm route không có trên menu) */
export const routeRoles: Record<string, Role[]> = {
  ...Object.fromEntries(
    navGroups.flatMap((g) => g.items.map((i) => [i.to, i.roles]))
  ),
  '/order': [PV],
  '/finance': [QL]
};
