import { useMemo, useState } from 'react';
import { CheckCircle2Icon, CircleDollarSignIcon, Clock3Icon, FileTextIcon, SearchIcon, ShieldAlertIcon, DownloadIcon, PrinterIcon, ArrowUpDownIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Field, inputClass } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { InvoiceModal } from '../components/cashier/InvoiceModal';
import { formatDateTime, formatShortVnd, formatVnd } from '../utils/format';
import type { CashVoucher, CashVoucherType, PurchaseRequest, PurchaseRequestStatus } from '../types';

type Tab = 'overview' | 'revenue' | 'vouchers' | 'requests' | 'reconciliation' | 'reports' | 'lookup';
type LedgerRow = { id: string; date: string; type: 'Doanh thu' | 'Chi phí'; group: string; description: string; source: string; method: string; amount: number; status: string; detail: string };
type Period = 'custom' | 'day' | 'week' | 'month' | 'quarter' | 'year';
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
const STATUS: Record<PurchaseRequestStatus, string> = { PENDING: 'Chờ quản lý duyệt', APPROVED: 'Đã duyệt ngân sách', REJECTED: 'Từ chối', REVISION_REQUESTED: 'Yêu cầu chỉnh sửa', MANAGER_APPROVED: 'Chờ kế toán tiếp nhận', ACCOUNTING_PENDING: 'Kế toán đang xử lý', ACCOUNTING_RECEIVED: 'Kế toán đã tiếp nhận', COMPLETED: 'Đã hoàn tất', DRAFT: 'Bản nháp' };
const total = (r: PurchaseRequest) => r.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);

export function Accountant({ initialTab }: { initialTab: Tab }) {
  const { user } = useAuth();
  const { purchaseRequests, processPurchaseRequest, orders, transactions, ingredients, batches, suppliers, cashierShifts, processCashierShift, cashLedger } = useApp();
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [action, setAction] = useState<Exclude<PurchaseRequestStatus, 'PENDING'> | null>(null);
  const [reason, setReason] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const initialToday = new Date();
  const initialStart = new Date(initialToday.getFullYear(), initialToday.getMonth() - 3, 1);
  const [start, setStart] = useState(isoDate(initialStart));
  const [end, setEnd] = useState(isoDate(initialToday));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [period, setPeriod] = useState<Period>('custom');
  const [ledgerType, setLedgerType] = useState('ALL');
  const [ledgerGroup, setLedgerGroup] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'type'>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<CashVoucher | null>(null);
  const [dashboardPeriod, setDashboardPeriod] = useState<'today'|'yesterday'|'7days'|'month'|'custom'>('custom');
  const [revenuePaymentFilter, setRevenuePaymentFilter] = useState('Tất cả');

  const setDashboardRange = (value: 'today'|'yesterday'|'7days'|'month'|'custom') => {
    setDashboardPeriod(value);
    if (value === 'custom') return;
    const today = new Date(); const from = new Date(today); const to = new Date(today);
    if (value === 'yesterday') { from.setDate(from.getDate()-1); to.setDate(to.getDate()-1); }
    if (value === '7days') from.setDate(from.getDate()-6);
    if (value === 'month') from.setDate(1);
    setStart(isoDate(from)); setEnd(isoDate(to));
  };

  const setPeriodValue = (value: Period) => {
    setPeriod(value);
    if (value === 'custom') return;
    const now = new Date(); const from = new Date(now); const to = new Date(now);
    if (value === 'day') { /* today */ }
    if (value === 'week') { const weekday = (now.getDay() + 6) % 7; from.setDate(now.getDate() - weekday); }
    if (value === 'month') from.setDate(1);
    if (value === 'quarter') { from.setMonth(Math.floor(now.getMonth() / 3) * 3, 1); }
    if (value === 'year') { from.setMonth(0, 1); }
    setStart(isoDate(from)); setEnd(isoDate(to));
  };

  const ledgerRows = useMemo<LedgerRow[]>(() => [
    ...orders.filter((o) => o.status === 'PAID' && o.paidAt && o.paidAt.slice(0, 10) >= start && o.paidAt.slice(0, 10) <= end).map((o) => ({
      id: o.id, date: o.paidAt!, type: 'Doanh thu' as const, group: 'Doanh thu bán hàng', description: `Hóa đơn bàn ${o.tableId} · giảm ${formatVnd(o.discount)}`, source: 'Hóa đơn bán hàng', method: o.paymentMethod ?? 'Chưa ghi nhận', amount: o.total, status: 'Đã thanh toán', detail: o.id
    })),
    ...cashLedger.vouchers.filter(v=>v.accountingTreatment!=='CASH_ONLY'&&v.date.slice(0,10)>=start&&v.date.slice(0,10)<=end).map(v=>({
      id:v.id,date:v.date,type:(v.accountingTreatment==='INCOME'?'Doanh thu':'Chi phí') as 'Doanh thu'|'Chi phí',group:v.category,description:v.description||v.reason,source:v.type==='RECEIPT'?'Phiếu thu':'Phiếu chi',method:v.method,amount:v.amount,status:v.status,detail:v.id
    }))
  ], [orders, cashLedger, start, end]);
  const visibleLedger = useMemo(() => ledgerRows.filter((row) =>
    (ledgerType === 'ALL' || row.type === ledgerType) && (ledgerGroup === 'ALL' || row.group === ledgerGroup) &&
    (paymentFilter === 'ALL' || row.method === paymentFilter) && row.amount >= (Number(amountFrom) || 0) &&
    (!amountTo || row.amount <= Number(amountTo)) && `${row.id} ${row.description} ${row.source} ${row.method}`.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => {
    const diff = sortBy === 'date' ? a.date.localeCompare(b.date) : sortBy === 'amount' ? a.amount - b.amount : a.type.localeCompare(b.type, 'vi');
    return sortDesc ? -diff : diff;
  }), [ledgerRows, ledgerType, ledgerGroup, paymentFilter, amountFrom, amountTo, query, sortBy, sortDesc]);
  const totalRevenue = ledgerRows.filter((row) => row.type === 'Doanh thu').reduce((sum, row) => sum + row.amount, 0);
  const totalExpense = ledgerRows.filter((row) => row.type === 'Chi phí').reduce((sum, row) => sum + row.amount, 0);
  const chartData = useMemo(() => {
    const from = new Date(`${start}T00:00:00`); const to = new Date(`${end}T00:00:00`);
    const span = Math.max(1, Math.round((to.getTime()-from.getTime())/86_400_000)+1);
    const monthly = span > 45;
    const buckets = new Map<string,{label:string;revenue:number;expense:number;net:number}>();
    ledgerRows.forEach((row) => {
      const date = new Date(row.date); const key = monthly ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}` : isoDate(date);
      const label = monthly ? date.toLocaleDateString('vi-VN',{month:'short',year:'2-digit'}) : date.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
      const item = buckets.get(key) ?? {label,revenue:0,expense:0,net:0};
      if (row.type==='Doanh thu') item.revenue += row.amount; else item.expense += row.amount;
      item.net = item.revenue-item.expense; buckets.set(key,item);
    });
    return Array.from(buckets.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([,item])=>item);
  },[ledgerRows,start,end]);
  const paymentBreakdown = useMemo(() => Array.from(new Set(ledgerRows.filter(r=>r.type==='Doanh thu').map(r=>r.method))).map(method=>{
    const rows=ledgerRows.filter(r=>r.type==='Doanh thu'&&r.method===method); const amount=rows.reduce((sum,r)=>sum+r.amount,0);
    return {method,amount,count:rows.length,share:totalRevenue?amount/totalRevenue*100:0};
  }),[ledgerRows,totalRevenue]);
  const exportLedger = () => {
    const values = [['Mã chứng từ','Ngày phát sinh','Loại giao dịch','Nhóm khoản','Nội dung','Nguồn chứng từ','Phương thức thanh toán','Số tiền','Trạng thái'], ...visibleLedger.map((r) => [r.id,r.date.slice(0,10),r.type,r.group,r.description,r.source,r.method,r.amount,r.status])];
    const csv = values.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `so-ke-toan-${start}-${end}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => purchaseRequests.filter((r) =>
    (status === 'ALL' || r.status === status) &&
    (`${r.id} ${r.requester} ${r.department}`.toLowerCase().includes(query.toLowerCase())) &&
    r.requestedAt.slice(0, 10) >= start && r.requestedAt.slice(0, 10) <= end
  ), [purchaseRequests, query, status, start, end]);

  const paid = orders.filter((o) => o.status === 'PAID' && o.paidAt && o.paidAt.slice(0, 10) >= start && o.paidAt.slice(0, 10) <= end);
  const revenueOrders = paid.filter((order) => revenuePaymentFilter === 'Tất cả' || order.paymentMethod === revenuePaymentFilter);
  const revenueTotal = revenueOrders.reduce((sum, order) => sum + order.total, 0);
  const revenueDiscount = revenueOrders.reduce((sum, order) => sum + order.discount, 0);
  const revenueVat = revenueOrders.reduce((sum, order) => sum + order.vat, 0);
  const shiftBreakdown = [
    { label: 'Ca sáng (06–14h)', from: 6, to: 14 },
    { label: 'Ca chiều (14–22h)', from: 14, to: 22 },
    { label: 'Ca đêm (22–06h)', from: 22, to: 6 }
  ].map((shift) => {
    const rows = revenueOrders.filter((order) => {
      const hour = new Date(order.paidAt!).getHours();
      return shift.from < shift.to ? hour >= shift.from && hour < shift.to : hour >= shift.from || hour < shift.to;
    });
    return { ...shift, count: rows.length, amount: rows.reduce((sum, order) => sum + order.total, 0) };
  });
  const submitAction = () => {
    if (!selected || !action) return;
    const transition = user?.role === 'Quản lý' ? (action === 'APPROVED' ? 'MANAGER_APPROVED' : action) : (action === 'APPROVED' && selected.status === 'MANAGER_APPROVED' ? 'ACCOUNTING_PENDING' : action === 'APPROVED' && selected.status === 'ACCOUNTING_PENDING' ? 'COMPLETED' : action);
    const result = processPurchaseRequest(selected.id, transition, reason);
    if (result) { setError(result); return; }
    setSuccess(`${STATUS[action]} thành công.`); setSelected(null); setAction(null); setReason(''); setError('');
  };

  const requestRows = filtered;
  const titles: Record<Tab, [string, string]> = {
    overview: ['Tổng quan kế toán', 'Theo dõi doanh thu và tra cứu chứng từ theo kỳ.'],
    revenue: ['Báo cáo doanh thu', 'Chỉ tính hóa đơn đã thanh toán. Order chưa thanh toán và đã hủy không được tính.'],
    vouchers: ['Phiếu thu, phiếu chi', 'Lập phiếu, theo dõi quỹ tiền mặt và tra cứu chứng từ thu chi.'],
    requests: [user?.role === 'Quản lý' ? 'Phê duyệt đề nghị nhập kho' : 'Tiếp nhận đề nghị nhập kho', 'Quản lý phê duyệt trước; kế toán tiếp nhận xử lý ngân sách sau.'],
    reconciliation: ['Đối chiếu ngân sách', 'Chi phí nhập kho chỉ tổng hợp giao dịch nhập kho ghi nhận từ ngày đề nghị trở đi.'],
    reports: ['Lập báo cáo doanh thu, chi phí', 'Tổng hợp từ hóa đơn bán hàng đã thanh toán và các nguồn chứng từ hiện có.'],
    lookup: ['Tra cứu doanh thu, chi phí', 'Tìm kiếm và truy xuất hóa đơn bán hàng đã thanh toán theo bộ lọc.']
  };

  return <div className="mx-auto max-w-7xl px-6 py-6">
    <PageHeader title={initialTab==='overview'?'Tổng quan báo cáo':titles[initialTab][0]} subtitle={initialTab==='overview'?'Doanh thu, chi phí và lợi nhuận được tổng hợp từ chứng từ nghiệp vụ.' : titles[initialTab][1]} action={initialTab==='revenue'?<Button variant="secondary" onClick={()=>{const data=[['Mã hóa đơn','Ngày thanh toán','Phương thức','Tạm tính','Giảm giá','VAT','Tổng thanh toán'],...revenueOrders.map(o=>[o.id,o.paidAt?.slice(0,10)??'',o.paymentMethod??'',o.subtotal,o.discount,o.vat,o.total])];const csv=data.map(row=>row.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`bao-cao-doanh-thu-${start}-${end}.csv`;a.click();URL.revokeObjectURL(url);}}><DownloadIcon className="h-4 w-4"/>Xuất CSV</Button>:undefined} />
    <div className="mb-5 flex flex-wrap gap-2">{([['overview','Tổng quan'],['revenue','Doanh thu'],['vouchers','Phiếu thu, chi'],['lookup','Tra cứu doanh thu, chi phí'],['reports','Lập báo cáo'],['requests','Đề nghị nhập kho'],['reconciliation','Đối chiếu ngân sách']] as [Tab,string][]).map(([tab,label])=><a key={tab} href={tab==='overview'?'/accountant':tab==='revenue'?'/accountant/revenue':tab==='vouchers'?'/accountant/cash-vouchers':tab==='requests'?'/accountant/requests':tab==='reconciliation'?'/accountant/reconciliation':tab==='reports'?'/accountant/reports':'/accountant/lookup'} className={`rounded-lg px-3 py-2 text-sm font-medium ${initialTab===tab?'bg-brand-600 text-white':'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{label}</a>)}</div>
    {success && <div role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}
    {initialTab!=='overview'&&<div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Phạm vi dữ liệu:</strong> Ứng dụng hiện dùng dữ liệu demo trong trình duyệt, chưa có API/backend; phiếu thu, phiếu chi và bảng lương chưa có mô hình chứng từ.</div>}

    {initialTab==='revenue'&&<div className="space-y-4">
      <Card className="overflow-hidden"><div className="flex items-center border-b border-amber-100 bg-amber-50 px-4 py-2 text-[11px] text-amber-800"><span className="font-medium">Bản demo — dữ liệu được mô phỏng và lưu cục bộ trên trình duyệt.</span></div><div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4"><div className="flex rounded-lg bg-slate-100 p-1">{([['today','Hôm nay'],['yesterday','Hôm qua'],['7days','7 ngày'],['month','Tháng này'],['custom','Tùy chọn']] as const).map(([value,label])=><button key={value} onClick={()=>setDashboardRange(value)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${dashboardPeriod===value?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</div>{dashboardPeriod==='custom'&&<div className="flex items-center gap-2"><input aria-label="Từ ngày" type="date" className={`${inputClass} w-auto`} value={start} onChange={e=>setStart(e.target.value)}/><span className="text-xs text-slate-400">đến</span><input aria-label="Đến ngày" type="date" className={`${inputClass} w-auto`} value={end} onChange={e=>setEnd(e.target.value)}/></div>}<select aria-label="Phương thức thanh toán" className={`${inputClass} ml-auto w-auto min-w-40`} value={revenuePaymentFilter} onChange={e=>setRevenuePaymentFilter(e.target.value)}><option>Tất cả</option><option>Tiền mặt</option><option>Thẻ</option><option>Chuyển khoản</option></select></div>
      <div className="grid grid-cols-2 divide-x divide-slate-100 md:grid-cols-5"><RevenueStat label={`Doanh thu đã thu · ${start.slice(8,10)}/${start.slice(5,7)}/${start.slice(0,4)} – ${end.slice(8,10)}/${end.slice(5,7)}/${end.slice(0,4)}`} value={formatVnd(revenueTotal)} note="Gồm VAT"/><RevenueStat label="Số hóa đơn" value={String(revenueOrders.length)} note="Đã thanh toán"/><RevenueStat label="Doanh thu thuần" value={formatVnd(revenueTotal-revenueVat)} note="Tiền hàng − giảm giá"/><RevenueStat label="Giảm giá" value={formatVnd(revenueDiscount)}/><RevenueStat label="VAT (8%)" value={formatVnd(revenueVat)}/></div></Card>
      <div className="grid gap-4 lg:grid-cols-2"><Card className="overflow-hidden"><CardHeader title="Theo phương thức thanh toán"/>{(['Tiền mặt','Thẻ','Chuyển khoản'] as const).map(method=>{const rows=revenueOrders.filter(o=>o.paymentMethod===method);const amount=rows.reduce((sum,o)=>sum+o.total,0);const share=revenueTotal?Math.round(amount/revenueTotal*100):0;return <div key={method} className="border-t border-slate-100 px-5 py-3"><div className="flex justify-between text-sm"><span>{method}</span><strong>{formatVnd(amount)}</strong></div><p className="mt-1 text-[11px] text-slate-400">{rows.length} hóa đơn · {share}%</p></div>})}</Card><Card className="overflow-hidden"><CardHeader title="Theo ca"/>{shiftBreakdown.map(shift=><div key={shift.label} className="border-t border-slate-100 px-5 py-3"><div className="flex justify-between text-sm"><span>{shift.label}</span><strong>{formatVnd(shift.amount)}</strong></div><p className="mt-1 text-[11px] text-slate-400">{shift.count} hóa đơn · {revenueTotal?Math.round(shift.amount/revenueTotal*100):0}%</p></div>)}</Card></div>
      <Card className="overflow-hidden"><CardHeader title={`Danh sách hóa đơn (${revenueOrders.length})`}/>{revenueOrders.length?<div className="overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead><tr><th className="px-5 py-3 text-left text-xs text-slate-500">Mã hóa đơn</th><th className="px-5 py-3 text-left text-xs text-slate-500">Ngày thanh toán</th><th className="px-5 py-3 text-left text-xs text-slate-500">Phương thức</th><th className="px-5 py-3 text-right text-xs text-slate-500">Giảm giá</th><th className="px-5 py-3 text-right text-xs text-slate-500">Tổng thanh toán</th><th className="px-5 py-3"/></tr></thead><tbody>{revenueOrders.slice().sort((a,b)=>b.paidAt!.localeCompare(a.paidAt!)).map(order=><tr key={order.id} className="border-t border-slate-100"><td className="px-5 py-3 font-medium">{order.id}{order.demo&&<span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">DEMO</span>}</td><td className="px-5 py-3">{formatDateTime(order.paidAt!)}</td><td className="px-5 py-3">{order.paymentMethod}</td><td className="px-5 py-3 text-right">{formatVnd(order.discount)}</td><td className="px-5 py-3 text-right font-semibold">{formatVnd(order.total)}</td><td className="px-5 py-3 text-right"><Button size="sm" variant="secondary" onClick={()=>setSelectedInvoice(order.id)}>Xem bill</Button></td></tr>)}</tbody></table></div>:<div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center"><FileTextIcon className="h-7 w-7 text-slate-300"/><p className="text-xs text-slate-500">Không có hóa đơn trong kỳ</p></div>}</Card>
    </div>}
    {initialTab==='vouchers'&&<CashVouchers/>}

    {initialTab==='overview'&&<>
      <Card className="mb-5 p-4"><div className="flex flex-wrap items-end gap-3"><Field label="Khoảng thời gian"><select className={inputClass} value={dashboardPeriod} onChange={e=>setDashboardRange(e.target.value as typeof dashboardPeriod)}><option value="today">Hôm nay</option><option value="yesterday">Hôm qua</option><option value="7days">7 ngày</option><option value="month">Tháng này</option><option value="custom">Tùy chọn</option></select></Field>{dashboardPeriod==='custom'&&<><Field label="Từ ngày"><input type="date" className={inputClass} value={start} onChange={e=>setStart(e.target.value)}/></Field><Field label="Đến ngày"><input type="date" className={inputClass} value={end} onChange={e=>setEnd(e.target.value)}/></Field></>}</div></Card>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric title="Tổng doanh thu" value={formatVnd(totalRevenue)} icon={<TrendingUpIcon className="h-5 w-5 text-blue-600"/>} detail={`Bán hàng + phiếu thu độc lập`}/><Metric title="Tổng chi phí" value={formatVnd(totalExpense)} icon={<TrendingDownIcon className="h-5 w-5 text-orange-500"/>} detail="Phiếu chi được chọn ghi nhận"/><Metric title="Lợi nhuận" value={formatVnd(totalRevenue-totalExpense)} icon={<CircleDollarSignIcon className="h-5 w-5 text-emerald-600"/>} detail={totalRevenue-totalExpense>=0?'Dương trong kỳ':'Âm trong kỳ'}/><Metric title="Số hóa đơn" value={String(paid.length)} icon={<FileTextIcon className="h-5 w-5"/>} detail="Hóa đơn đã thanh toán"/><Metric title="Số chứng từ" value={String(ledgerRows.length)} icon={<Clock3Icon className="h-5 w-5"/>} detail="Hóa đơn + phiếu được ghi nhận"/></div>
      <Card className="mb-5 overflow-hidden"><CardHeader title="Doanh thu · Chi phí · Lợi nhuận" subtitle={`${start} → ${end} · Tổng hợp theo ${chartData.length && new Date(`${end}T00:00:00`).getTime()-new Date(`${start}T00:00:00`).getTime()>45*86_400_000?'tháng':'ngày'}`}/>{chartData.length?<div className="h-72 px-3 py-4"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData}><defs><linearGradient id="accountingRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2246d4" stopOpacity={0.18}/><stop offset="100%" stopColor="#2246d4" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/><XAxis dataKey="label" tick={{fontSize:12,fill:'#64748b'}} axisLine={false} tickLine={false}/><YAxis tickFormatter={(value)=>formatShortVnd(Number(value))} tick={{fontSize:12,fill:'#64748b'}} axisLine={false} tickLine={false} width={48}/><Tooltip formatter={(value:number)=>formatVnd(value)} contentStyle={{borderRadius:10,border:'1px solid #e2e8f0',fontSize:12}}/><Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#2246d4" strokeWidth={2} fill="url(#accountingRevenue)"/><Line type="monotone" dataKey="expense" name="Chi phí" stroke="#f97316" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="net" name="Lợi nhuận" stroke="#10b981" strokeWidth={2} dot={false}/></ComposedChart></ResponsiveContainer></div>:<p className="py-16 text-center text-sm text-slate-500">Không có hóa đơn hoặc chứng từ trong khoảng thời gian này.</p>}<div className="flex flex-wrap gap-4 border-t border-slate-200 px-5 py-3 text-xs text-slate-600"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand-600"/>Doanh thu</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-orange-500"/>Chi phí</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500"/>Lợi nhuận</span></div></Card>
      <div className="mb-5 grid gap-5 xl:grid-cols-2"><Card className="overflow-hidden"><CardHeader title="Doanh thu theo phương thức thanh toán" subtitle="Số tiền, số hóa đơn và tỷ trọng trong kỳ"/><TableWrap><table className="w-full text-sm"><thead><tr><th>Phương thức</th><th>Số tiền</th><th>Giao dịch</th><th>Tỷ trọng</th></tr></thead><tbody>{paymentBreakdown.map(row=><tr key={row.method}><td>{row.method}</td><td>{formatVnd(row.amount)}</td><td>{row.count}</td><td>{row.share.toFixed(1)}%</td></tr>)}{!paymentBreakdown.length&&<tr><td colSpan={4} className="py-8 text-center text-slate-500">Chưa có doanh thu trong kỳ</td></tr>}</tbody></table></TableWrap></Card><Card className="overflow-hidden"><CardHeader title="Cơ cấu doanh thu và chi phí" subtitle="Tổng hợp theo chứng từ đã có trong hệ thống"/><div className="space-y-4 p-5"><SummaryBar label="Doanh thu bán hàng" amount={totalRevenue} total={totalRevenue}/><SummaryBar label="Doanh thu phiếu thu độc lập" amount={0} total={totalRevenue}/><SummaryBar label="Chi phí phiếu chi" amount={0} total={totalExpense}/><SummaryBar label="Chi phí trả lương" amount={0} total={totalExpense}/><p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Ứng dụng hiện chưa có chứng từ phiếu thu, phiếu chi hoặc bảng lương. Không có chi phí nào được suy ra từ giá vốn hay đề nghị mua hàng.</p></div></Card></div>
      <Card className="mb-5 overflow-hidden"><CardHeader title="Hóa đơn bán hàng trong kỳ" subtitle="Chọn hóa đơn để xem chứng từ gốc"/><TableWrap><table className="w-full text-sm"><thead><tr><th>Ngày</th><th>Mã hóa đơn</th><th>Thanh toán</th><th>Giảm giá</th><th>Thực thu</th><th/></tr></thead><tbody>{visibleLedger.slice(0,10).map(row=><tr key={row.id}><td>{formatDateTime(row.date)}</td><td>{row.id}</td><td>{row.method}</td><td>{formatVnd(orders.find(o=>o.id===row.id)?.discount??0)}</td><td>{formatVnd(row.amount)}</td><td><Button size="sm" variant="secondary" onClick={()=>setSelectedInvoice(row.id)}>Xem hóa đơn</Button></td></tr>)}</tbody></table></TableWrap></Card>
    </>}

    {(initialTab === 'reports' || initialTab === 'lookup') && <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Tổng doanh thu" value={formatVnd(totalRevenue)} icon={<CircleDollarSignIcon className="h-5 w-5" />} />
        <Metric title="Tổng chi phí có chứng từ" value={formatVnd(totalExpense)} icon={<FileTextIcon className="h-5 w-5" />} />
        <Metric title="Chênh lệch thu chi" value={formatVnd(totalRevenue-totalExpense)} icon={<CheckCircle2Icon className="h-5 w-5" />} />
        <Metric title="Chứng từ trong kỳ" value={String(visibleLedger.length)} icon={<Clock3Icon className="h-5 w-5" />} />
      </div>
      <Card className="mb-5 p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="Kỳ báo cáo"><select className={inputClass} value={period} onChange={(e)=>setPeriodValue(e.target.value as Period)}><option value="custom">Tùy chọn</option><option value="day">Hôm nay</option><option value="week">Tuần này</option><option value="month">Tháng này</option><option value="quarter">Quý này</option><option value="year">Năm nay</option></select></Field><Field label="Từ ngày"><input type="date" className={inputClass} value={start} onChange={(e) => {setPeriod('custom');setStart(e.target.value);}} /></Field><Field label="Đến ngày"><input type="date" className={inputClass} value={end} onChange={(e) => {setPeriod('custom');setEnd(e.target.value);}} /></Field></div><p className="mt-3 text-sm text-slate-600">Doanh thu lấy theo ngày thanh toán hóa đơn. Chưa có mô hình dữ liệu phiếu thu, phiếu chi, thanh toán nhập hàng hoặc bảng lương; chi phí hiện để 0 khi chưa có chứng từ chi phí.</p></Card>
    </>}

    {(initialTab === 'lookup' || initialTab === 'reports') && <Card className="mb-5 overflow-hidden"><CardHeader title={initialTab==='reports'?'Báo cáo doanh thu – chi phí':'Tra cứu chứng từ doanh thu'} subtitle={`${start} đến ${end} · ${visibleLedger.length} chứng từ`} action={<div className="flex gap-2 no-print"><Button size="sm" variant="secondary" onClick={exportLedger}><DownloadIcon className="mr-1 h-4 w-4"/>Xuất CSV</Button><Button size="sm" variant="secondary" onClick={()=>window.print()}><PrinterIcon className="mr-1 h-4 w-4"/>In / PDF</Button></div>} />
      <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4 no-print"><div className="relative"><SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input className={`${inputClass} pl-9`} placeholder="Mã hóa đơn, nội dung" value={query} onChange={e=>setQuery(e.target.value)}/></div><select className={inputClass} value={ledgerType} onChange={e=>setLedgerType(e.target.value)}><option value="ALL">Doanh thu và chi phí</option><option value="Doanh thu">Doanh thu</option><option value="Chi phí">Chi phí</option></select><select className={inputClass} value={ledgerGroup} onChange={e=>setLedgerGroup(e.target.value)}><option value="ALL">Mọi nhóm khoản</option><option value="Doanh thu bán hàng">Doanh thu bán hàng</option></select><select className={inputClass} value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)}><option value="ALL">Mọi phương thức</option>{Array.from(new Set(ledgerRows.map(r=>r.method))).map(m=><option key={m}>{m}</option>)}</select><Field label="Số tiền từ"><input type="number" min="0" className={inputClass} value={amountFrom} onChange={e=>setAmountFrom(e.target.value)}/></Field><Field label="Số tiền đến"><input type="number" min="0" className={inputClass} value={amountTo} onChange={e=>setAmountTo(e.target.value)}/></Field><button className="inline-flex items-center gap-2 text-sm text-brand-700" onClick={()=>{setSortDesc(!sortDesc);setSortBy(sortBy==='date'?'amount':sortBy==='amount'?'type':'date');}}><ArrowUpDownIcon className="h-4 w-4"/>Sắp xếp: {sortBy==='date'?'ngày':sortBy==='amount'?'số tiền':'loại giao dịch'} ({sortDesc?'giảm':'tăng'})</button></div>
      {initialTab==='reports'&&<div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2"><Info label="Tổng doanh thu bán hàng" value={formatVnd(totalRevenue)}/><Info label="Tổng doanh thu" value={formatVnd(totalRevenue)}/><Info label="Tổng chi phí" value={formatVnd(totalExpense)}/><Info label="Chênh lệch thu chi" value={formatVnd(totalRevenue-totalExpense)}/></div>}
      <TableWrap><table className="w-full min-w-[900px] text-sm"><thead><tr>{['STT','Mã chứng từ','Ngày phát sinh','Loại giao dịch','Nhóm khoản','Nội dung','Nguồn chứng từ','Phương thức','Số tiền','Trạng thái',''].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{visibleLedger.map((row,index)=><tr key={row.id}><td>{index+1}</td><td className="font-semibold">{row.id}</td><td>{formatDateTime(row.date)}</td><td>{row.type}</td><td>{row.group}</td><td>{row.description}</td><td>{row.source}</td><td>{row.method}</td><td>{formatVnd(row.amount)}</td><td>{row.status}</td><td><Button size="sm" variant="secondary" onClick={()=>{if(row.source==='Hóa đơn bán hàng')setSelectedInvoice(row.detail);else setSelectedVoucher(cashLedger.vouchers.find(v=>v.id===row.detail)??null);}}>Chi tiết</Button></td></tr>)}{!visibleLedger.length&&<tr><td colSpan={11} className="py-10 text-center text-slate-500">Không có chứng từ khớp với bộ lọc.</td></tr>}</tbody></table></TableWrap>
    </Card>}

    {initialTab==='overview'&&<div className="no-print mb-5 flex justify-end gap-2"><Button variant="secondary" onClick={exportLedger}><DownloadIcon className="mr-1 h-4 w-4"/>Xuất CSV</Button><Button variant="secondary" onClick={()=>window.print()}><PrinterIcon className="mr-1 h-4 w-4"/>In / PDF</Button></div>}

    {initialTab === 'requests' && <RequestsCard requests={requestRows} query={query} setQuery={setQuery} status={status} setStatus={setStatus} start={start} setStart={setStart} end={end} setEnd={setEnd} onSelect={setSelected} />}
    {initialTab === 'reports' && <CashierReports shifts={cashierShifts} onProcess={processCashierShift} />}

    {initialTab === 'reconciliation' && <Reconciliation requests={purchaseRequests} transactions={transactions} start={start} end={end} setStart={setStart} setEnd={setEnd} query={query} setQuery={setQuery} suppliers={suppliers} batches={batches} />}

    {initialTab === 'reports' && <Card className="overflow-hidden">
      <CardHeader title="Doanh thu và giá vốn theo đơn đã thanh toán" subtitle="Chi phí mua hàng và công nợ NCC chưa có mô hình dữ liệu." />
      <TableWrap><table className="w-full text-sm"><thead><tr><th>Ngày thanh toán</th><th>Mã đơn</th><th>Doanh thu</th><th>Giá vốn ghi nhận</th><th>Lợi nhuận gộp ước tính</th></tr></thead><tbody>
        {paid.map((o) => <tr key={o.id}><td>{o.paidAt && formatDateTime(o.paidAt)}</td><td>{o.id}</td><td>{formatVnd(o.total)}</td><td>{formatVnd(o.cost ?? 0)}</td><td>{formatVnd(o.total - (o.cost ?? 0))}</td></tr>)}
      </tbody></table></TableWrap>
      <div className="flex justify-end p-4"><Button variant="secondary" onClick={() => {
        const csv = ['Ngay,Ma don,Doanh thu,Gia von,Loi nhuan', ...paid.map((o) => `${o.paidAt?.slice(0, 10)},${o.id},${o.total},${o.cost ?? 0},${o.total - (o.cost ?? 0)}`)].join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `bao-cao-ke-toan-${start}-${end}.csv`; a.click(); URL.revokeObjectURL(a.href);
      }}>Xuất CSV (Excel)</Button></div>
    </Card>}

    <Modal open={!!selected} onClose={() => { setSelected(null); setAction(null); setError(''); }} title={selected ? `Chi tiết đề nghị ${selected.id}` : ''} description="Phê duyệt chỉ xác nhận đề nghị, không thay đổi tồn kho." width="max-w-3xl" footer={selected && (user?.role === 'Quản lý' ? selected.status === 'PENDING' && selected.requester !== user.name : user?.role === 'Kế toán' && ['MANAGER_APPROVED','ACCOUNTING_PENDING'].includes(selected.status)) ? <><Button variant="secondary" onClick={() => setSelected(null)}>Đóng</Button>{selected.status === 'PENDING' && user?.role === 'Quản lý' && <Button variant="secondary" onClick={() => { setAction('REVISION_REQUESTED'); setReason(''); }}>Yêu cầu chỉnh sửa</Button>}<Button variant="danger" onClick={() => { setAction('REJECTED'); setReason(''); }}>Từ chối</Button><Button onClick={() => { setAction('APPROVED'); setReason(''); }}>{user?.role === 'Quản lý' ? 'Phê duyệt & chuyển kế toán' : selected.status === 'MANAGER_APPROVED' ? 'Tiếp nhận xử lý' : 'Xác nhận hoàn tất'}</Button></> : undefined}>
      {selected && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Info label="Ngày tạo" value={formatDateTime(selected.requestedAt)} /><Info label="Người đề nghị" value={`${selected.requester} · ${selected.department}`} /><Info label="Ngân sách đề xuất" value={formatVnd(total(selected))} /></div><p className="rounded-lg bg-slate-50 p-3 text-sm"><strong>Lý do:</strong> {selected.reason}<br /><strong>Ghi chú:</strong> {selected.note || '—'}</p><TableWrap><table className="w-full text-sm"><thead><tr><th>Nguyên liệu</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>{selected.lines.map((line, i) => { const item = ingredients.find((x) => x.id === line.ingredientId); return <tr key={`${line.ingredientId}-${i}`}><td>{item?.name ?? line.ingredientId}</td><td>{line.quantity} {item?.unit}</td><td>{formatVnd(line.unitCost)}</td><td>{formatVnd(line.quantity * line.unitCost)}</td></tr>; })}</tbody></table></TableWrap><p className="text-sm">Ngân sách phân bổ/còn lại: <span className="text-slate-500">Chưa được hệ thống theo dõi.</span></p><div><h3 className="mb-2 font-semibold">Lịch sử xử lý</h3>{selected.history.length ? selected.history.map((event) => <div key={event.id} className="border-l-2 border-slate-200 py-2 pl-3 text-sm"><strong>{event.action}</strong> · {event.actor} · {formatDateTime(event.at)}{event.reason && <p className="text-slate-500">Lý do: {event.reason}</p>}</div>) : <p className="text-sm text-slate-500">Chưa xử lý.</p>}</div></div>}
    </Modal>
    <InvoiceModal order={orders.find((order)=>order.id===selectedInvoice)??null} onClose={()=>setSelectedInvoice(null)} />
    {selectedVoucher&&<Modal open onClose={()=>setSelectedVoucher(null)} title={`${selectedVoucher.type==='RECEIPT'?'Phiếu thu':'Phiếu chi'} ${selectedVoucher.id}`} width="max-w-3xl" footer={<><Button variant="secondary" onClick={()=>setSelectedVoucher(null)}>Đóng</Button><Button onClick={()=>window.print()}><PrinterIcon className="h-4 w-4"/>In / Lưu PDF</Button></>}><VoucherPrintForm voucher={selectedVoucher} bankAccountName={cashLedger.bankAccountName}/></Modal>}
    <Modal open={!!action} onClose={() => { setAction(null); setError(''); }} title={action === 'APPROVED' ? 'Xác nhận xử lý đề nghị' : action === 'REJECTED' ? 'Từ chối đề nghị' : 'Yêu cầu chỉnh sửa'} description="Hành động sẽ được ghi vào lịch sử đề nghị." footer={<><Button variant="secondary" onClick={() => setAction(null)}>Hủy</Button><Button variant={action === 'REJECTED' ? 'danger' : 'primary'} onClick={submitAction}>Xác nhận</Button></>}>
      {action && action !== 'APPROVED' && <Field label="Lý do / nội dung cần sửa"><textarea className={`${inputClass} min-h-24`} value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>}{error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-700"><ShieldAlertIcon className="h-4 w-4" />{error}</p>}
    </Modal>
  </div>;
}

function CashVouchers(){
 const {cashLedger,createCashVoucher}=useApp();
 const [type,setType]=useState<CashVoucherType>('RECEIPT'); const [date,setDate]=useState(isoDate(new Date()));
 const [partyType,setPartyType]=useState<CashVoucher['partyType']>('Khách hàng'); const [partyName,setPartyName]=useState('');
 const [category,setCategory]=useState('Thu dịch vụ'); const [reason,setReason]=useState(''); const [description,setDescription]=useState('');
 const [amount,setAmount]=useState(''); const [method,setMethod]=useState<CashVoucher['method']>('Tiền mặt');
 const [recognize,setRecognize]=useState(true);
 const [bankAccount,setBankAccount]=useState(''); const [attachment,setAttachment]=useState('');
 const [search,setSearch]=useState(''); const [kindFilter,setKindFilter]=useState('ALL'); const [methodFilter,setMethodFilter]=useState('ALL');
 const [partyFilter,setPartyFilter]=useState('ALL'); const [from,setFrom]=useState(''); const [to,setTo]=useState('');
 const [selected,setSelected]=useState<CashVoucher|null>(null); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
 const cashBalance=cashLedger.openingCash+cashLedger.vouchers.filter(v=>v.method==='Tiền mặt').reduce((s,v)=>s+(v.type==='RECEIPT'?v.amount:-v.amount),0);
 const bankBalance=cashLedger.openingBank+cashLedger.vouchers.filter(v=>v.method==='Chuyển khoản'&&v.bankAccount==='VCB-Demo').reduce((s,v)=>s+(v.type==='RECEIPT'?v.amount:-v.amount),0);
 const categories=type==='RECEIPT'?['Thu dịch vụ','Thu hoàn ứng','Thu thanh lý','Thu khác']:['Chi phí nguyên vật liệu','Chi phí lương nhân viên','Chi phí điện, nước, gas','Chi phí thuê mặt bằng','Chi phí vận hành và quản lý','Chi phí marketing','Chi phí sửa chữa, bảo trì','Chi phí khác'];
 const changeType=(next:CashVoucherType)=>{setType(next);setCategory(next==='RECEIPT'?'Thu dịch vụ':'Chi phí khác');setPartyType(next==='RECEIPT'?'Khách hàng':'Nhà cung cấp');setRecognize(true);setError('');};
 const rows=cashLedger.vouchers.filter(v=>(kindFilter==='ALL'||v.type===kindFilter)&&(methodFilter==='ALL'||v.method===methodFilter)&&(partyFilter==='ALL'||v.partyType===partyFilter)&&(!from||v.date.slice(0,10)>=from)&&(!to||v.date.slice(0,10)<=to)&&`${v.id} ${v.partyName} ${v.reason} ${v.description} ${v.category}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date));
 const submit=(event:React.FormEvent)=>{event.preventDefault();setError('');setNotice('');
   if(!partyName.trim()||!reason.trim()||!date||!amount){setError('Vui lòng nhập ngày, đối tượng, lý do và số tiền.');return;}
   const issue=createCashVoucher({type,date:new Date(`${date}T12:00:00`).toISOString(),partyType,partyName:partyName.trim(),category,reason:reason.trim(),description:description.trim(),amount:Number(amount),method,...(method==='Chuyển khoản'?{bankAccount:'VCB-Demo'}:{}),attachment:attachment||undefined,accountingTreatment:recognize?(type==='RECEIPT'?'INCOME':'EXPENSE'):'CASH_ONLY'});
   if(issue){setError(issue);return;}
   setNotice('Đã lưu phiếu và cập nhật số dư quỹ.');setPartyName('');setReason('');setDescription('');setAmount('');setAttachment('');
 };
 const form=<form onSubmit={submit} className="space-y-4">
  <div className="flex rounded-lg bg-slate-100 p-1">{([['RECEIPT','Lập phiếu thu'],['PAYMENT','Lập phiếu chi']] as [CashVoucherType,string][]).map(([v,label])=><button type="button" key={v} onClick={()=>changeType(v)} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${type===v?'bg-white text-slate-900 shadow-sm':'text-slate-500'}`}>{label}</button>)}</div>
  <div className="grid gap-3 sm:grid-cols-2"><Field label="Ngày lập *"><input required type="date" className={inputClass} value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label="Số tiền *"><input required type="number" min="1" step="1" className={inputClass} value={amount} onChange={e=>setAmount(e.target.value)}/></Field>
   <Field label="Đối tượng *"><select className={inputClass} value={partyType} onChange={e=>setPartyType(e.target.value as CashVoucher['partyType'])}>{(type==='RECEIPT'?['Khách hàng','Nhà cung cấp','Nhân viên','Khác']:['Nhà cung cấp','Nhân viên','Khách hàng','Khác']).map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Tên đối tượng *"><input required className={inputClass} value={partyName} onChange={e=>setPartyName(e.target.value)} placeholder="Nhập tên đối tượng"/></Field>
   <Field label={type==='RECEIPT'?'Nhóm khoản thu *':'Nhóm khoản chi *'}><select className={inputClass} value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Phương thức thanh toán *"><select className={inputClass} value={method} onChange={e=>setMethod(e.target.value as CashVoucher['method'])}><option>Tiền mặt</option><option>Chuyển khoản</option></select></Field>
   {method==='Chuyển khoản'&&<Field label="Tài khoản ngân hàng *"><select required className={inputClass} value={bankAccount} onChange={e=>setBankAccount(e.target.value)}><option value="">Chọn tài khoản</option><option value="VCB-Demo">{cashLedger.bankAccountName} · {formatVnd(bankBalance)}</option></select></Field>}
   <Field label="Lý do *"><input required className={inputClass} value={reason} onChange={e=>setReason(e.target.value)} placeholder={type==='RECEIPT'?'Lý do thu tiền':'Lý do chi tiền'}/></Field>
   <Field label="Diễn giải"><input className={inputClass} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Thông tin bổ sung"/></Field><Field label="Chứng từ đính kèm"><input type="file" className={inputClass} onChange={e=>setAttachment(e.target.files?.[0]?.name??'')}/></Field>
  </div>
  <label className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" checked={recognize} onChange={e=>setRecognize(e.target.checked)} className="mt-0.5"/><span>Ghi nhận phiếu này vào {type==='RECEIPT'?'thu nhập khác':'chi phí mới'} trong báo cáo kết quả kinh doanh. Bỏ chọn nếu phiếu chỉ phản ánh thu/chi tiền hoặc khoản đã ghi nhận ở nghiệp vụ khác.</span></label>
  <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Phiếu demo chưa liên kết công nợ phải thu/phải trả hoặc bảng lương vì hệ thống chưa có các sổ nguồn này. Không chọn các khoản này như thanh toán công nợ; khoản thu thanh toán hóa đơn bán hàng không được nhập lại tại đây.</p>
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="text-sm text-emerald-700">{notice}</p>}
  <div className="flex justify-end"><Button type="submit">Lưu {type==='RECEIPT'?'phiếu thu':'phiếu chi'}</Button></div>
 </form>;
 return <div className="space-y-5">
  <div className="grid gap-3 sm:grid-cols-2"><Card className="p-4"><p className="text-xs text-slate-500">Số dư quỹ tiền mặt demo</p><p className="mt-1 text-xl font-bold">{formatVnd(cashBalance)}</p></Card><Card className="p-4"><p className="text-xs text-slate-500">{cashLedger.bankAccountName}</p><p className="mt-1 text-xl font-bold">{formatVnd(bankBalance)}</p></Card></div>
  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"><Card className="p-5"><CardHeader title="Lập phiếu thu / chi" subtitle="Lưu chứng từ và cập nhật số dư trong cùng một giao dịch cục bộ."/>{form}</Card><Card className="overflow-hidden"><CardHeader title={`Tra cứu phiếu (${rows.length})`} subtitle="Tìm theo mã phiếu hoặc nội dung"/><div className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-2"><input className={inputClass} placeholder="Mã phiếu, đối tượng, nội dung" value={search} onChange={e=>setSearch(e.target.value)}/><select className={inputClass} value={kindFilter} onChange={e=>setKindFilter(e.target.value)}><option value="ALL">Tất cả phiếu</option><option value="RECEIPT">Phiếu thu</option><option value="PAYMENT">Phiếu chi</option></select><select className={inputClass} value={methodFilter} onChange={e=>setMethodFilter(e.target.value)}><option value="ALL">Mọi phương thức</option><option>Tiền mặt</option><option>Chuyển khoản</option></select><select className={inputClass} value={partyFilter} onChange={e=>setPartyFilter(e.target.value)}><option value="ALL">Mọi đối tượng</option>{['Khách hàng','Nhà cung cấp','Nhân viên','Khác'].map(x=><option key={x}>{x}</option>)}</select><input aria-label="Từ ngày" type="date" className={inputClass} value={from} onChange={e=>setFrom(e.target.value)}/><input aria-label="Đến ngày" type="date" className={inputClass} value={to} onChange={e=>setTo(e.target.value)}/></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr>{['Mã phiếu','Ngày','Loại','Đối tượng','Nhóm','Phương thức','Số tiền','Người lập',''].map(x=><th key={x} className="px-3 py-2 text-left text-xs text-slate-500">{x}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{row.id}{row.demo&&<span className="ml-1 text-[10px] text-amber-700">DEMO</span>}</td><td className="px-3 py-3">{row.date.slice(0,10)}</td><td className="px-3 py-3">{row.type==='RECEIPT'?'Phiếu thu':'Phiếu chi'}</td><td className="px-3 py-3">{row.partyName}</td><td className="px-3 py-3">{row.category}</td><td className="px-3 py-3">{row.method}</td><td className="px-3 py-3 text-right">{formatVnd(row.amount)}</td><td className="px-3 py-3">{row.createdBy}</td><td className="px-3 py-3"><Button size="sm" variant="secondary" onClick={()=>setSelected(row)}>Chi tiết</Button></td></tr>)}{!rows.length&&<tr><td colSpan={9} className="py-10 text-center text-slate-500">Không tìm thấy phiếu phù hợp.</td></tr>}</tbody></table></div></Card></div>
  {selected&&<Modal open={!!selected} onClose={()=>setSelected(null)} title={`${selected.type==='RECEIPT'?'Phiếu thu':'Phiếu chi'} ${selected.id}`} width="max-w-3xl" footer={<><Button variant="secondary" onClick={()=>setSelected(null)}>Đóng</Button><Button onClick={()=>window.print()}><PrinterIcon className="h-4 w-4"/>In / Lưu PDF</Button></>}><VoucherPrintForm voucher={selected} bankAccountName={cashLedger.bankAccountName}/></Modal>}
 </div>;
}

function VoucherPrintForm({voucher,bankAccountName}:{voucher:CashVoucher;bankAccountName:string}){
 const isReceipt=voucher.type==='RECEIPT'; const date=new Date(voucher.date);
 const amountText=numberInVietnamese(voucher.amount);
 return <article className="print-form voucher-print">
  <header className="voucher-top"><div className="voucher-company"><strong>NHÀ HÀNG SEN VÀNG</strong><span>128 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh</span><span>Điện thoại: 028 3822 6688</span></div><div className="voucher-reference"><strong>Mẫu số {isReceipt?'01-TT':'02-TT'}</strong><span>(Ban hành theo chế độ chứng từ kế toán)</span><span>Quyển số: ........................</span><span>Số: <b>{voucher.id}</b></span><span>Nợ: ............................</span><span>Có: ............................</span></div></header>
  <div className="voucher-title"><h2>{isReceipt?'PHIẾU THU':'PHIẾU CHI'}</h2><p>Ngày {date.getDate()} tháng {date.getMonth()+1} năm {date.getFullYear()}</p></div>
  <section className="voucher-details"><div className="voucher-line"><span>Họ và tên người {isReceipt?'nộp':'nhận'} tiền</span><strong>{voucher.partyName}</strong></div><div className="voucher-line"><span>Địa chỉ / đối tượng</span><strong>{voucher.partyType}</strong></div><div className="voucher-line"><span>Lý do {isReceipt?'thu':'chi'}</span><strong>{voucher.reason}</strong></div><div className="voucher-line"><span>Nhóm khoản</span><strong>{voucher.category}</strong></div>{voucher.description&&<div className="voucher-line"><span>Diễn giải</span><span>{voucher.description}</span></div>}<div className="voucher-line voucher-amount"><span>Số tiền</span><strong>{formatVnd(voucher.amount)}</strong></div><div className="voucher-line"><span>Bằng chữ</span><em>{amountText} đồng chẵn</em></div><div className="voucher-line"><span>Phương thức</span><span>{voucher.method}{voucher.bankAccount?` · ${bankAccountName}`:''}</span></div><div className="voucher-line"><span>Kèm theo</span><span>{voucher.attachment||'Không'} · Chứng từ gốc: {voucher.id}</span></div></section>
  <p className="voucher-sign-date">Ngày ........ tháng ........ năm ........</p>
  <section className="voucher-signatures"><div><strong>GIÁM ĐỐC</strong><em>(Ký, họ tên, đóng dấu)</em><span className="voucher-sign-space"/></div><div><strong>KẾ TOÁN TRƯỞNG</strong><em>(Ký, họ tên)</em><span className="voucher-sign-space"/></div><div><strong>{isReceipt?'NGƯỜI NỘP TIỀN':'THỦ QUỸ'}</strong><em>(Ký, họ tên)</em><span className="voucher-sign-space"/>{!isReceipt&&<b>[Thủ quỹ]</b>}</div><div><strong>NGƯỜI LẬP PHIẾU</strong><em>(Ký, họ tên)</em><span className="voucher-sign-space"/><b>{voucher.createdBy}</b></div><div><strong>{isReceipt?'THỦ QUỸ':'NGƯỜI NHẬN TIỀN'}</strong><em>(Ký, họ tên)</em><span className="voucher-sign-space"/>{isReceipt&&<b>[Thủ quỹ]</b>}</div></section>
  <div className="voucher-received">Đã nhận đủ số tiền (viết bằng chữ): <em>{amountText} đồng chẵn</em></div>
 </article>;
}

function numberInVietnamese(value:number){
 const n=Math.floor(Math.abs(value)); if(!n)return 'Không';
 const digits=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
 const readGroup=(x:number,forceHundreds:boolean)=>{const h=Math.floor(x/100),t=Math.floor(x%100/10),u=x%10;const words:string[]=[];if(h||forceHundreds)words.push(`${digits[h]} trăm`);if(t>1){words.push(`${digits[t]} mươi`);if(u===1)words.push('mốt');else if(u===5)words.push('lăm');else if(u)words.push(digits[u]);}else if(t===1){words.push('mười');if(u===5)words.push('lăm');else if(u)words.push(digits[u]);}else if(u){if(h)words.push('lẻ');words.push(digits[u]);}return words.join(' ');};
 const units=['','nghìn','triệu','tỷ','nghìn tỷ','triệu tỷ'];const groups:number[]=[];let rest=n;while(rest>0){groups.push(rest%1000);rest=Math.floor(rest/1000);}const parts:string[]=[];for(let i=groups.length-1;i>=0;i--){if(groups[i])parts.push(`${readGroup(groups[i],i<groups.length-1)}${units[i]?` ${units[i]}`:''}`);}const text=parts.join(' ').trim();return text.charAt(0).toLocaleUpperCase('vi-VN')+text.slice(1);
}

function CashierReports({shifts,onProcess}:{shifts:ReturnType<typeof useApp>['cashierShifts'];onProcess:ReturnType<typeof useApp>['processCashierShift']}){
 const [selected,setSelected]=useState<string|null>(null);const [note,setNote]=useState('');const [error,setError]=useState('');
 const rows=shifts.filter(s=>s.status!=='OPEN');
 return <Card className="mb-5 overflow-hidden"><CardHeader title="Báo cáo chốt ca thu ngân" subtitle="Chỉ hiển thị ca đã chốt, chờ kế toán tiếp nhận hoặc kiểm tra lại."/><TableWrap><table className="w-full min-w-[800px] text-sm"><thead><tr><th>Mã ca</th><th>Thu ngân</th><th>Giờ mở / chốt</th><th>Tiền đầu ca</th><th>Doanh thu tiền mặt</th><th>Chênh lệch</th><th>Trạng thái</th><th/></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td>{s.id}</td><td>{s.cashier}</td><td>{formatDateTime(s.openedAt)}<div>{s.closedAt&&formatDateTime(s.closedAt)}</div></td><td>{formatVnd(s.openingCash)}</td><td>{formatVnd(s.cashSales??0)}</td><td>{formatVnd(s.variance??0)}</td><td>{s.status==='ACCOUNTING_RECEIVED'?'Kế toán đã tiếp nhận':s.status==='REVIEW'?'Cần kiểm tra lại':'Chờ kế toán tiếp nhận'}</td><td><Button size="sm" variant="secondary" onClick={()=>setSelected(selected===s.id?null:s.id)}>Chi tiết</Button></td></tr>)}{!rows.length&&<tr><td colSpan={8} className="py-8 text-center text-slate-400">Chưa có ca được chốt.</td></tr>}</tbody></table></TableWrap>{selected&&(()=>{const s=rows.find(x=>x.id===selected);return s?<div className="border-t p-4 text-sm"><h3 className="mb-3 font-semibold">Chi tiết ca {s.id}</h3><div className="grid gap-2 sm:grid-cols-2"><Info label="Tiền mặt đầu ca" value={formatVnd(s.openingCash)}/><Info label="Doanh thu tiền mặt" value={formatVnd(s.cashSales??0)}/><Info label="Chuyển khoản" value={formatVnd(s.transferSales??0)}/><Info label="Phương thức khác" value={formatVnd(s.otherSales??0)}/><Info label="Tiền mặt dự kiến" value={formatVnd(s.expectedCash??0)}/><Info label="Tiền mặt thực tế" value={formatVnd(s.actualCash??0)}/><Info label="Chênh lệch / lý do" value={`${formatVnd(s.variance??0)} · ${s.varianceReason||'Không có'}`}/></div>{s.status!=='ACCOUNTING_RECEIVED'&&<div className="mt-4 flex flex-wrap gap-2"><input className={inputClass+' max-w-sm'} placeholder="Ghi chú tiếp nhận / yêu cầu rà soát" value={note} onChange={e=>setNote(e.target.value)}/><Button onClick={()=>{const err=onProcess(s.id,'ACCOUNTING_RECEIVED',note);setError(err??'');}} >Tiếp nhận ca</Button><Button variant="secondary" onClick={()=>{const err=onProcess(s.id,'REVIEW',note);setError(err??'');}}>Yêu cầu kiểm tra lại</Button></div>}{(error||s.accountingNote)&&<p className="mt-2 text-red-600">{error||s.accountingNote}</p>}</div>:null})()}</Card>;
}

function Metric({ title, value, icon, detail }: { title: string; value: string; icon: React.ReactNode; detail?: string }) { return <Card className="p-4"><div className="flex items-center justify-between text-slate-500"><span className="text-xs font-medium">{title}</span>{icon}</div><p className="mt-3 text-lg font-bold text-slate-900">{value}</p>{detail&&<p className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</p>}</Card>; }
function RevenueStat({label,value,note}:{label:string;value:string;note?:string}) { return <div className="min-h-[74px] px-4 py-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-lg font-bold leading-none text-slate-900">{value}</p>{note&&<p className="mt-1 text-[10px] text-slate-400">{note}</p>}</div>; }
function SummaryBar({label,amount,total}:{label:string;amount:number;total:number}) { const share=total?amount/total*100:0; return <div><div className="mb-1 flex justify-between gap-3 text-sm"><span>{label}</span><span className="font-semibold">{formatVnd(amount)} <span className="font-normal text-slate-500">({share.toFixed(1)}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{width:`${Math.min(100,share)}%`}}/></div></div>; }
function RequestsCard({ requests, query, setQuery, status, setStatus, start, setStart, end, setEnd, onSelect }: { requests: PurchaseRequest[]; query: string; setQuery: (v: string) => void; status: string; setStatus: (v: string) => void; start: string; setStart: (v: string) => void; end: string; setEnd: (v: string) => void; onSelect: (r: PurchaseRequest) => void }) {
  const rows = requests.filter((r) => (`${r.id} ${r.requester} ${r.department}`.toLowerCase().includes(query.toLowerCase())) && (status === 'ALL' || r.status === status));
  return <Card className="mb-5 overflow-hidden">
    <CardHeader title="Đề nghị nhập hàng" subtitle="Danh sách sẽ hiển thị khi có dữ liệu đề nghị được tạo." />
    <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3">
      <div className="relative"><SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className={`${inputClass} pl-9`} placeholder="Mã phiếu hoặc người đề nghị" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">Mọi trạng thái</option>{Object.entries(STATUS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select>
      <div className="flex gap-2"><input aria-label="Từ ngày" type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} /><input aria-label="Đến ngày" type="date" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{['Mã phiếu / ngày', 'Người đề nghị', 'Hàng hóa', 'Ngân sách', 'Trạng thái', ''].map((x) => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
      {rows.map((r) => <tr key={r.id}><td className="px-4 py-3"><strong>{r.id}</strong><div className="text-xs text-slate-500">{formatDateTime(r.requestedAt)}</div></td><td className="px-4 py-3">{r.requester}<div className="text-xs text-slate-500">{r.department}</div></td><td className="px-4 py-3">{r.lines.length} mặt hàng</td><td className="px-4 py-3 font-semibold">{formatVnd(total(r))}</td><td className="px-4 py-3"><Badge tone={r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : r.status === 'PENDING' ? 'amber' : 'blue'}>{STATUS[r.status]}</Badge></td><td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={() => onSelect(r)}>Chi tiết</Button></td></tr>)}
      {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Chưa có đề nghị nào phù hợp.</td></tr>}
    </tbody></table></div>
  </Card>;
}
function Reconciliation({ requests, transactions, start, end, setStart, setEnd, query, setQuery, suppliers, batches }: { requests: PurchaseRequest[]; transactions: ReturnType<typeof useApp>['transactions']; start: string; end: string; setStart: (v: string) => void; setEnd: (v: string) => void; query: string; setQuery: (v: string) => void; suppliers: ReturnType<typeof useApp>['suppliers']; batches: ReturnType<typeof useApp>['batches'] }) {
  return <Card className="overflow-hidden">
    <CardHeader title="Bảng đối chiếu đề nghị" subtitle="Khoản nhập được ghép theo nguyên liệu và thời điểm; cần mã liên kết chứng từ để đối chiếu chính xác." />
    <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3"><input aria-label="Từ ngày" type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} /><input aria-label="Đến ngày" type="date" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} /><select className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)}><option value="">Tất cả nhà cung cấp</option>{suppliers.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
    <TableWrap><table className="w-full min-w-[780px] text-sm"><thead><tr><th>Mã đề nghị</th><th>Nhà cung cấp*</th><th>Ngân sách duyệt</th><th>Nhập kho ghi nhận</th><th>Chênh lệch**</th><th>Trạng thái</th></tr></thead><tbody>
      {requests.filter((r) => r.status === 'APPROVED' && r.requestedAt.slice(0, 10) >= start && r.requestedAt.slice(0, 10) <= end).filter((r) => !query || r.lines.some((line) => batches.some((b) => b.ingredientId === line.ingredientId && suppliers.find((s) => s.id === b.supplierId)?.name === query))).map((r) => {
        const actual = transactions.filter((tx) => tx.type === 'NHẬP KHO' && tx.at >= r.requestedAt && r.lines.some((line) => line.ingredientId === tx.ingredientId)).reduce((sum, tx) => sum + tx.value, 0);
        const budget = total(r); const delta = actual - budget;
        return <tr key={r.id}><td>{r.id}</td><td>Chưa liên kết</td><td>{formatVnd(budget)}</td><td>{actual ? formatVnd(actual) : 'Chưa có chứng từ liên kết'}</td><td>{actual ? `${formatVnd(delta)} (${budget ? (delta / budget * 100).toFixed(1) : 0}%)` : '—'}</td><td>Chưa đối chiếu</td></tr>;
      })}
      {!requests.some((r) => r.status === 'APPROVED') && <tr><td colSpan={6}>Chưa có đề nghị đã duyệt.</td></tr>}
    </tbody></table></TableWrap>
    <p className="px-5 py-3 text-xs text-slate-500">* Nhà cung cấp và hóa đơn chưa được liên kết với đề nghị. **Tạm tính theo nguyên liệu trùng nhau, không thay thế đối chiếu chứng từ.</p>
  </Card>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
function TableWrap({ children }: { children: React.ReactNode }) { return <div className="overflow-x-auto px-4"><table className="w-full min-w-[700px] text-sm [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-3 [&_td]:py-3 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:text-slate-500">{children}</table></div>; }
