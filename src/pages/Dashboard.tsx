import { Link } from 'react-router-dom';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BoxesIcon,
  ChefHatIcon,
  FlameIcon,
  PackageIcon,
  ReceiptTextIcon,
  TimerIcon,
  TrendingDownIcon,
  UtensilsCrossedIcon,
  WarehouseIcon } from
'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatTile } from '../components/dashboard/StatTile';
import { useApp } from '../contexts/AppContext';
import { useMetrics } from '../hooks/useMetrics';
import { formatDayLabel, formatQty, formatShortVnd, formatVnd } from '../utils/format';
import { countdownLabel, daysLeft } from '../utils/inventory';

const GROUP_COLORS = ['#2246d4', '#0ea5e9', '#10b981', '#f59e0b', '#a855f7'];

export function Dashboard() {
  const { ingredientOf } = useApp();
  const m = useMetrics();

  const chartData = m.series.map((s) => ({
    label: formatDayLabel(s.date),
    'Doanh thu': s.revenue,
    'Chi phí': s.cost,
    'Lợi nhuận': s.profit
  }));

  const margin = m.revenueToday ?
  (m.profitToday / m.revenueToday * 100).toFixed(1) :
  '0';

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Tổng quan hôm nay"
        subtitle="Doanh thu, giá vốn nguyên liệu và tình trạng kho theo thời gian thực"
        action={
        <div className="flex gap-2">
            <Link to="/receive">
              <Button variant="secondary">
                <PackageIcon className="h-4 w-4" />
                Nhập hàng
              </Button>
            </Link>
            <Link to="/tables">
              <Button>
                <ReceiptTextIcon className="h-4 w-4" />
                Sơ đồ bàn
              </Button>
            </Link>
          </div>
        } />
      

      {/* Hàng 1: P&L (chính) + cảnh báo hạn sử dụng */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-6 py-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Doanh thu hôm nay
              </p>
              <p className="tabular mt-2 text-2xl font-semibold text-slate-900">
                {formatVnd(m.revenueToday)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tháng này: {formatVnd(m.revenueMonth)}
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Chi phí nguyên liệu
              </p>
              <p className="tabular mt-2 text-2xl font-semibold text-slate-900">
                {formatVnd(m.costToday)}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <TrendingDownIcon className="h-3.5 w-3.5 text-red-500" />
                Hao hụt/hủy: {formatVnd(m.disposalCostToday)}
              </p>
            </div>
            <div className="bg-brand-50/60 px-6 py-6">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
                Lợi nhuận gộp
              </p>
              <p className="tabular mt-2 text-4xl font-semibold leading-none text-brand-800">
                {formatVnd(m.profitToday)}
              </p>
              <p className="mt-2 text-xs text-brand-700">
                Biên lợi nhuận {margin}% · Doanh thu − Giá vốn
              </p>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader
            title="Cần xử lý ngay"
            subtitle="Nguyên liệu sắp hết hạn theo nguyên tắc FEFO"
            action={
            <Link
              to="/expiry"
              className="text-xs font-medium text-brand-600 hover:text-brand-700">
              
                Xem tất cả
              </Link>
            } />
          
          <ul className="divide-y divide-slate-100">
            {m.nearExpiry.slice(0, 3).map((b) => {
              const ing = ingredientOf(b.ingredientId);
              return (
                <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <TimerIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {ing.name}
                    </p>
                    <p className="tabular text-xs text-slate-500">
                      {formatQty(b.quantity, ing.unit)} · {b.id}
                    </p>
                  </div>
                  <Badge tone={daysLeft(b.expiryDate) <= 1 ? 'red' : 'amber'}>
                    {countdownLabel(b.expiryDate)}
                  </Badge>
                </li>);

            })}
            {m.expired.slice(0, 2).map((b) => {
              const ing = ingredientOf(b.ingredientId);
              return (
                <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <AlertTriangleIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {ing.name}
                    </p>
                    <p className="tabular text-xs text-slate-500">
                      {formatQty(b.quantity, ing.unit)} · {b.id}
                    </p>
                  </div>
                  <Badge tone="red">{countdownLabel(b.expiryDate)}</Badge>
                </li>);

            })}
          </ul>
          <div className="flex gap-2 border-t border-slate-200 px-5 py-3">
            <Link to="/specials" className="flex-1">
              <Button variant="warning" size="sm" className="w-full">
                <FlameIcon className="h-4 w-4" />
                Tạo món đặc biệt
              </Button>
            </Link>
            <Link to="/expired" className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                Xử lý hết hạn
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Hàng 2: biểu đồ */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader
            title="Doanh thu · Chi phí · Lợi nhuận theo ngày"
            subtitle="7 ngày gần nhất" />
          
          <div className="h-72 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2246d4" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2246d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false} />
                
                <YAxis
                  tickFormatter={(v) => formatShortVnd(Number(v))}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={48} />
                
                <Tooltip
                  formatter={(v: number) => formatVnd(v)}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: 12
                  }} />
                
                <Area
                  type="monotone"
                  dataKey="Doanh thu"
                  stroke="#2246d4"
                  strokeWidth={2}
                  fill="url(#rev)" />
                
                <Line
                  type="monotone"
                  dataKey="Chi phí"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false} />
                
                <Line
                  type="monotone"
                  dataKey="Lợi nhuận"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false} />
                
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 border-t border-slate-200 px-5 py-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-brand-600" /> Doanh thu
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-orange-500" /> Chi phí nguyên liệu
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-emerald-500" /> Lợi nhuận gộp
            </span>
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader title="Top món bán chạy" subtitle="Số phần đã bán hôm nay" />
          <ul className="divide-y divide-slate-100">
            {m.topDishes.map((d, i) =>
            <li
              key={d.name}
              className="flex items-center gap-3 px-5 py-2.5">
              
                <span className="tabular w-4 text-xs font-semibold text-slate-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-800">{d.name}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                    className="h-full rounded-full bg-brand-500"
                    style={{
                      width: `${d.sold / (m.topDishes[0]?.sold || 1) * 100}%`
                    }} />
                  
                  </div>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-semibold text-slate-900">
                    {d.sold}
                  </p>
                  <p className="tabular text-[11px] text-slate-400">
                    {formatShortVnd(d.revenue)}
                  </p>
                </div>
              </li>
            )}
          </ul>
        </Card>
      </div>

      {/* Hàng 3: chỉ số kho + chi phí theo nhóm */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:col-span-8 xl:grid-cols-4">
          <StatTile
            label="Giá trị tồn kho"
            value={formatVnd(m.stockValue)}
            hint={`${m.activeBatchCount} lô khả dụng`}
            icon={WarehouseIcon}
            to="/inventory" />
          
          <StatTile
            label="Số nguyên liệu"
            value={String(m.ingredientCount)}
            hint="đang theo dõi"
            icon={BoxesIcon}
            to="/inventory" />
          
          <StatTile
            label="Nguyên liệu sắp hết"
            value={String(m.lowStock.length)}
            tone="orange"
            hint="dưới tồn tối thiểu"
            icon={AlertTriangleIcon}
            to="/inventory" />
          
          <StatTile
            label="Lô sắp hết hạn"
            value={String(m.nearExpiry.length)}
            tone="amber"
            hint="≤ 2 ngày"
            icon={TimerIcon}
            to="/expiry" />
          
          <StatTile
            label="Lô đã hết hạn"
            value={String(m.expired.length)}
            tone="red"
            hint="chờ xử lý hủy"
            icon={AlertTriangleIcon}
            to="/expired" />
          
          <StatTile
            label="Món đã bán hôm nay"
            value={String(m.dishesSoldToday)}
            hint="đã hoàn thành"
            icon={UtensilsCrossedIcon} />
          
          <StatTile
            label="Đơn hàng hôm nay"
            value={String(m.ordersToday)}
            hint={`${m.openOrders.length} bàn đang mở`}
            icon={ReceiptTextIcon}
            to="/cashier" />
          
          <StatTile
            label="Món chờ bếp"
            value={String(m.kitchenLines.reduce((s, l) => s + l.qty, 0))}
            hint="đang chờ / đang nấu"
            icon={ChefHatIcon}
            to="/kitchen" />
          
        </div>

        <Card className="xl:col-span-4">
          <CardHeader
            title="Giá trị tồn theo nhóm nguyên liệu"
            subtitle="Phân bổ vốn đang nằm trong kho" />
          
          <div className="h-56 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.costByGroup} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatShortVnd(Number(v))}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false} />
                
                <YAxis
                  type="category"
                  dataKey="group"
                  tick={{ fontSize: 12, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                  width={72} />
                
                <Tooltip
                  formatter={(v: number) => formatVnd(v)}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: 12
                  }} />
                
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                  {m.costByGroup.map((_, i) =>
                  <Cell key={i} fill={GROUP_COLORS[i % GROUP_COLORS.length]} />
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>);

}
