import { useMemo, useState, type ReactNode } from 'react';
import { AlertCircleIcon, ArrowDownRightIcon, CalendarDaysIcon, FileTextIcon, SearchIcon, WalletIcon } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { inputClass } from '../components/ui/Field';
import { InvoiceModal } from '../components/cashier/InvoiceModal';
import { useApp } from '../contexts/AppContext';
import type { CashVoucher, Order } from '../types';
import { formatDateTime, formatShortVnd, formatVnd } from '../utils/format';

type ExpenseRow = { id: string; date: string; group: string; description: string; source: 'Bill bán hàng' | 'Phiếu chi'; method: string; amount: number; order?: Order; voucher?: CashVoucher; demo?: boolean };
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function ExpenseTracking() {
  const { orders, cashLedger, debts } = useApp();
  const now = new Date();
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth() - 2, 1)));
  const [to, setTo] = useState(iso(now));
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('ALL');
  const [method, setMethod] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<CashVoucher | null>(null);

  const expenseRows = useMemo<ExpenseRow[]>(() => [
    ...orders.filter((order) => order.status === 'PAID' && !!order.paidAt && (order.cost ?? 0) > 0 && order.paidAt.slice(0, 10) >= from && order.paidAt.slice(0, 10) <= to).map((order) => ({
      id: order.id, date: order.paidAt!, group: 'Giá vốn nguyên liệu', description: `Nguyên liệu thực tế tiêu hao cho bill bàn ${order.tableId}`, source: 'Bill bán hàng' as const, method: order.paymentMethod ?? '—', amount: order.cost ?? 0, order, demo: order.demo
    })),
    ...cashLedger.vouchers.filter((voucher) => voucher.type === 'PAYMENT' && voucher.accountingTreatment === 'EXPENSE' && voucher.date.slice(0, 10) >= from && voucher.date.slice(0, 10) <= to).map((voucher) => ({
      id: voucher.id, date: voucher.date, group: voucher.category, description: voucher.description || voucher.reason, source: 'Phiếu chi' as const, method: voucher.method, amount: voucher.amount, voucher, demo: voucher.demo
    }))
  ], [orders, cashLedger.vouchers, from, to]);

  const groups = useMemo(() => Array.from(new Set(expenseRows.map((row) => row.group))).sort((a, b) => a.localeCompare(b, 'vi')), [expenseRows]);
  const visibleRows = useMemo(() => expenseRows.filter((row) => (group === 'ALL' || row.group === group) && (method === 'ALL' || row.method === method) && `${row.id} ${row.group} ${row.description} ${row.source}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))).sort((a, b) => b.date.localeCompare(a.date)), [expenseRows, group, method, query]);
  const cogs = expenseRows.filter((row) => row.source === 'Bill bán hàng').reduce((sum, row) => sum + row.amount, 0);
  const operating = expenseRows.filter((row) => row.source === 'Phiếu chi').reduce((sum, row) => sum + row.amount, 0);
  const total = cogs + operating;
  const supplierVoucherIds = new Set(debts.filter((debt) => debt.side === 'payable').map((debt) => debt.id));
  const supplierPayments = cashLedger.vouchers.filter((voucher) => voucher.type === 'PAYMENT' && voucher.debtId && supplierVoucherIds.has(voucher.debtId) && voucher.date.slice(0, 10) >= from && voucher.date.slice(0, 10) <= to).sort((a, b) => b.date.localeCompare(a.date));
  const supplierPaid = supplierPayments.reduce((sum, voucher) => sum + voucher.amount, 0);

  const chart = useMemo(() => {
    const buckets = new Map<string, { label: string; cogs: number; operating: number }>();
    expenseRows.forEach((row) => {
      const date = new Date(row.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
      const item = buckets.get(key) ?? { label, cogs: 0, operating: 0 };
      if (row.source === 'Bill bán hàng') item.cogs += row.amount; else item.operating += row.amount;
      buckets.set(key, item);
    });
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  }, [expenseRows]);
  const categoryTotals = groups.map((name) => ({ name, amount: expenseRows.filter((row) => row.group === name).reduce((sum, row) => sum + row.amount, 0), count: expenseRows.filter((row) => row.group === name).length })).sort((a, b) => b.amount - a.amount);

  const exportCsv = () => {
    const values = [['Mã chứng từ', 'Ngày phát sinh', 'Nhóm chi phí', 'Nội dung', 'Nguồn', 'Phương thức', 'Số tiền'], ...visibleRows.map((row) => [row.id, row.date.slice(0, 10), row.group, row.description, row.source, row.method, row.amount])];
    const csv = values.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `theo-doi-chi-phi-${from}-${to}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="mx-auto max-w-7xl px-5 py-6">
    <PageHeader title="Theo dõi chi phí" subtitle="Giá vốn theo bill đã thanh toán và chi phí hoạt động từ phiếu chi được ghi nhận." action={<Button variant="secondary" onClick={exportCsv}><FileTextIcon className="h-4 w-4"/>Xuất CSV</Button>} />
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"><div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><CalendarDaysIcon className="h-4 w-4 text-brand-600"/>Kỳ theo dõi</div><label className="text-xs text-slate-500">Từ ngày<input type="date" className={inputClass + ' mt-1'} value={from} onChange={(event) => setFrom(event.target.value)}/></label><label className="text-xs text-slate-500">Đến ngày<input type="date" className={inputClass + ' mt-1'} value={to} onChange={(event) => setTo(event.target.value)}/></label><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => { const day = new Date(); setFrom(iso(new Date(day.getFullYear(), day.getMonth(), 1))); setTo(iso(day)); }}>Tháng này</Button><Button size="sm" variant="ghost" onClick={() => { const day = new Date(); setFrom(iso(new Date(day.getFullYear(), day.getMonth() - 1, 1))); setTo(iso(new Date(day.getFullYear(), day.getMonth(), 0))); }}>Tháng trước</Button></div></div>

    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric title="Tổng chi phí ghi nhận" amount={total} icon={<ArrowDownRightIcon className="h-4 w-4"/>} tint="rose" note={`${expenseRows.length} chứng từ trong kỳ`}/><Metric title="Giá vốn nguyên liệu" amount={cogs} icon={<FileTextIcon className="h-4 w-4"/>} tint="blue" note="Tiêu hao theo bill đã thanh toán"/><Metric title="Chi phí hoạt động" amount={operating} icon={<WalletIcon className="h-4 w-4"/>} tint="amber" note="Phiếu chi có ghi nhận chi phí"/><Metric title="Đã trả NCC theo công nợ" amount={supplierPaid} icon={<AlertCircleIcon className="h-4 w-4"/>} tint="violet" note="Dòng tiền riêng · không cộng vào chi phí"/></div>

    <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]"><Card className="p-5"><CardHeader title="Biến động chi phí" subtitle={`${from} – ${to} · theo tháng`}/><div className="h-72 w-full pt-4">{chart.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{ top: 10, right: 12, left: 8, bottom: 0 }}><defs><linearGradient id="expenseCogs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient><linearGradient id="expenseOps" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/><XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12}/><YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => formatShortVnd(value)}/><Tooltip formatter={(value) => formatVnd(Number(value))}/><Area type="monotone" dataKey="cogs" name="Giá vốn" stroke="#6366f1" strokeWidth={2.5} fill="url(#expenseCogs)"/><Area type="monotone" dataKey="operating" name="Chi phí hoạt động" stroke="#f59e0b" strokeWidth={2.5} fill="url(#expenseOps)"/></AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Chưa có chi phí trong kỳ đã chọn.</div>}</div></Card>
      <Card className="overflow-hidden"><CardHeader title="Cơ cấu chi phí" subtitle="Theo nhóm khoản ghi nhận"/><div className="space-y-4 p-5">{categoryTotals.length ? categoryTotals.map((item) => <div key={item.name}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span>{item.name}</span><span className="font-semibold">{formatVnd(item.amount)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${total ? Math.max(2, item.amount / total * 100) : 0}%` }}/></div><p className="mt-1 text-xs text-slate-400">{item.count} chứng từ · {total ? (item.amount / total * 100).toFixed(1) : '0.0'}%</p></div>) : <p className="py-10 text-center text-sm text-slate-400">Chưa có dữ liệu phân nhóm.</p>}</div></Card></div>

    <Card className="mb-5 overflow-hidden"><CardHeader title={`Chứng từ chi phí (${visibleRows.length})`} subtitle="Mở bill bán hàng hoặc phiếu chi gốc để đối chiếu." action={<Badge tone="blue" dot>Đã lọc theo kỳ</Badge>}/><div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-4"><label className="relative md:col-span-2"><SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input className={`${inputClass} pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã bill, phiếu chi, nội dung"/></label><select className={inputClass} value={group} onChange={(event) => setGroup(event.target.value)}><option value="ALL">Mọi nhóm chi phí</option>{groups.map((name) => <option key={name}>{name}</option>)}</select><select className={inputClass} value={method} onChange={(event) => setMethod(event.target.value)}><option value="ALL">Mọi phương thức</option>{Array.from(new Set(expenseRows.map((row) => row.method))).map((value) => <option key={value}>{value}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Mã chứng từ','Ngày','Nhóm chi phí','Nội dung','Nguồn','Phương thức','Số tiền',''].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visibleRows.map((row) => <tr key={`${row.source}-${row.id}`} className="hover:bg-slate-50/70"><td className="px-4 py-3 font-semibold">{row.id}{row.demo && <div className="text-[10px] font-normal text-amber-700">DEMO</div>}</td><td className="whitespace-nowrap px-4 py-3">{formatDateTime(row.date)}</td><td className="px-4 py-3">{row.group}</td><td className="px-4 py-3">{row.description}</td><td className="px-4 py-3">{row.source}</td><td className="px-4 py-3">{row.method}</td><td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{formatVnd(row.amount)}</td><td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={() => row.order ? setSelectedOrder(row.order) : setSelectedVoucher(row.voucher ?? null)}>Chi tiết</Button></td></tr>)}{!visibleRows.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">Không có chứng từ chi phí khớp với bộ lọc.</td></tr>}</tbody></table></div></Card>

    <Card className="overflow-hidden"><CardHeader title="Dòng tiền trả nhà cung cấp" subtitle="Hiển thị riêng để phân biệt thanh toán công nợ với chi phí đã ghi nhận." action={<Badge tone="amber">Không cộng vào tổng chi phí</Badge>}/><div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Mã phiếu chi','Ngày','Nhà cung cấp','Chứng từ nhập gốc','Phương thức','Số tiền',''].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{supplierPayments.map((voucher) => <tr key={voucher.id}><td className="px-4 py-3 font-semibold">{voucher.id}</td><td className="px-4 py-3">{formatDateTime(voucher.date)}</td><td className="px-4 py-3">{voucher.partyName}</td><td className="px-4 py-3">{voucher.sourceDocumentId ?? '—'}</td><td className="px-4 py-3">{voucher.method}</td><td className="px-4 py-3 text-right">{formatVnd(voucher.amount)}</td><td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={() => setSelectedVoucher(voucher)}>Chi tiết</Button></td></tr>)}{!supplierPayments.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Chưa có phiếu chi trả công nợ nhà cung cấp trong kỳ.</td></tr>}</tbody></table></div></Card>

    <InvoiceModal order={selectedOrder} onClose={() => setSelectedOrder(null)}/>
    {selectedVoucher && <Modal open onClose={() => setSelectedVoucher(null)} title={`Phiếu chi ${selectedVoucher.id}`} description={`Công nợ ${selectedVoucher.debtId ?? '—'} · nguồn ${selectedVoucher.sourceDocumentId ?? '—'}`} footer={<Button variant="secondary" onClick={() => setSelectedVoucher(null)}>Đóng</Button>}><dl className="grid gap-3 sm:grid-cols-2">{[['Ngày lập',formatDateTime(selectedVoucher.date)],['Nhà cung cấp',selectedVoucher.partyName],['Nội dung',selectedVoucher.reason],['Phương thức',selectedVoucher.method],['Số tiền',formatVnd(selectedVoucher.amount)],['Diễn giải',selectedVoucher.description]].map(([label,value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl></Modal>}
  </div>;
}

function Metric({ title, amount, icon, tint, note }: { title: string; amount: number; icon: ReactNode; tint: 'rose'|'blue'|'amber'|'violet'; note: string }) {
  const styles = { rose: 'bg-rose-50 text-rose-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' };
  return <Card className="p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{title}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tint]}`}>{icon}</span></div><p className="mt-3 text-xl font-bold text-slate-900">{formatVnd(amount)}</p><p className="mt-1 text-xs text-slate-500">{note}</p></Card>;
}
