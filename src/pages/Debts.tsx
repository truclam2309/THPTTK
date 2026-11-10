import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircleIcon, ArrowDownLeftIcon, ArrowUpRightIcon, CalendarDaysIcon, FileTextIcon, SearchIcon, UsersIcon } from 'lucide-react';
import type { CashVoucher, CashVoucherMethod, DebtRecord, StockTx } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { InvoiceModal } from '../components/cashier/InvoiceModal';
import { Field, inputClass } from '../components/ui/Field';
import { useApp } from '../contexts/AppContext';
import { formatVnd } from '../utils/format';

type DebtSide = 'receivable' | 'payable';
type DebtStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
const statusLabel: Record<DebtStatus, string> = { UNPAID: 'Chưa thanh toán', PARTIAL: 'Thanh toán một phần', PAID: 'Đã thanh toán', OVERDUE: 'Quá hạn' };
const dateLabel = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN');
const today = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };
const statusOf = (debt: DebtRecord, day: string): DebtStatus => debt.paid >= debt.amount ? 'PAID' : debt.dueDate < day ? 'OVERDUE' : debt.paid > 0 ? 'PARTIAL' : 'UNPAID';
const remainingOf = (debt: DebtRecord) => Math.max(0, debt.amount - debt.paid);

export function Debts() {
  const { debts, orders, transactions, batches, suppliers, cashLedger, ingredientOf, createPayableFromReceipt, settleDebt } = useApp();
  const [side, setSide] = useState<DebtSide>('payable');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DebtStatus>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<DebtRecord | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<CashVoucher | null>(null);
  const [sourceInvoice, setSourceInvoice] = useState<import('../types').Order | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [sourceTxId, setSourceTxId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<CashVoucherMethod>('Tiền mặt');
  const [error, setError] = useState('');
  const isReceivable = side === 'receivable';
  const day = today();
  const sideRows = useMemo(() => debts.filter((debt) => debt.side === side), [debts, side]);
  const rows = useMemo(() => sideRows.filter((debt) => {
    const matchesText = `${debt.id} ${debt.sourceId} ${debt.party} ${debt.sourceLabel}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'));
    return matchesText && (statusFilter === 'ALL' || statusOf(debt, day) === statusFilter) && (!from || debt.date >= from) && (!to || debt.date <= to);
  }), [sideRows, query, statusFilter, from, to, day]);
  const totalOpen = sideRows.reduce((sum, debt) => sum + remainingOf(debt), 0);
  const overdueRows = sideRows.filter((debt) => statusOf(debt, day) === 'OVERDUE');
  const overdue = overdueRows.reduce((sum, debt) => sum + remainingOf(debt), 0);
  const upcomingDate = new Date(); upcomingDate.setDate(upcomingDate.getDate() + 7);
  const upcomingEnd = `${upcomingDate.getFullYear()}-${String(upcomingDate.getMonth() + 1).padStart(2, '0')}-${String(upcomingDate.getDate()).padStart(2, '0')}`;
  const upcoming = sideRows.filter((debt) => remainingOf(debt) > 0 && debt.dueDate >= day && debt.dueDate <= upcomingEnd).reduce((sum, debt) => sum + remainingOf(debt), 0);
  const settledCount = sideRows.filter((debt) => statusOf(debt, day) === 'PAID').length;
  const availableReceipts = transactions.filter((tx) => tx.type === 'NHẬP KHO' && !debts.some((debt) => debt.side === 'payable' && debt.sourceId === tx.id));
  const selectedTx = availableReceipts.find((tx) => tx.id === sourceTxId);
  const detailRecord = selected ? debts.find((debt) => debt.id === selected.id) ?? selected : null;
  const sourceTx = detailRecord?.sourceType === 'GOODS_RECEIPT' ? transactions.find((tx) => tx.id === detailRecord.sourceId) : undefined;
  const sourceBatch = sourceTx ? batches.find((batch) => batch.id === sourceTx.batchId) : undefined;
  const sourceOrder = detailRecord?.sourceType === 'SALES_INVOICE' ? orders.find((order) => order.id === detailRecord.sourceId) : undefined;

  const submitCreate = () => {
    const result = createPayableFromReceipt(sourceTxId, dueDate);
    setError(result ?? '');
    if (!result) { setCreateOpen(false); setSourceTxId(''); setDueDate(''); }
  };
  const submitPayment = () => {
    if (!detailRecord) return;
    const result = settleDebt(detailRecord.id, Number(payAmount), payMethod);
    setError(result ?? '');
    if (!result) { setPayAmount(''); setSelected(null); }
  };
  const txDescription = (tx: StockTx) => {
    const batch = batches.find((item) => item.id === tx.batchId);
    const supplier = suppliers.find((item) => item.id === batch?.supplierId);
    return `${tx.batchId} · ${supplier?.name ?? 'Nhà cung cấp'} · ${formatVnd(tx.value)}`;
  };

  return <div className="mx-auto max-w-7xl px-5 py-6">
    <PageHeader title="Quản lý công nợ" subtitle="Mỗi khoản phải thu gắn với bill; mỗi khoản phải trả gắn với phiếu nhập kho." action={<Badge tone="blue" dot>Liên kết chứng từ gốc</Badge>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <DebtMetric title={isReceivable ? 'Tổng còn phải thu' : 'Tổng còn phải trả'} value={formatVnd(totalOpen)} note={`${sideRows.filter((debt) => remainingOf(debt) > 0).length} khoản đang mở`} icon={isReceivable ? <ArrowDownLeftIcon className="h-4 w-4" /> : <ArrowUpRightIcon className="h-4 w-4" />} tone={isReceivable ? 'blue' : 'orange'} />
      <DebtMetric title="Sắp đến hạn · 7 ngày" value={formatVnd(upcoming)} note="Số dư chưa thanh toán" icon={<CalendarDaysIcon className="h-4 w-4" />} tone="amber" />
      <DebtMetric title="Quá hạn" value={formatVnd(overdue)} note={`${overdueRows.length} khoản quá hạn`} icon={<AlertCircleIcon className="h-4 w-4" />} tone="red" />
      <DebtMetric title="Đã tất toán" value={`${settledCount} khoản`} note="Có chứng từ nguồn đối chiếu" icon={<FileTextIcon className="h-4 w-4" />} tone="green" />
    </div>

    <Card className="mb-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div className="flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => { setSide('payable'); setError(''); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${!isReceivable ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Phải trả nhà cung cấp</button><button type="button" onClick={() => { setSide('receivable'); setError(''); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isReceivable ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Phải thu khách hàng</button></div>{isReceivable ? <Badge tone="slate">Tạo tự động từ bill khi thu thiếu</Badge> : <Button variant="secondary" onClick={() => { setError(''); setCreateOpen(true); }}>+ Lập công nợ từ phiếu nhập</Button>}</div>
      <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-5"><label className="relative md:col-span-2"><SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input className={`${inputClass} pl-9`} placeholder={isReceivable ? 'Mã bill, khách hàng' : 'Mã phiếu nhập, nhà cung cấp'} value={query} onChange={(event) => setQuery(event.target.value)}/></label><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | DebtStatus)}><option value="ALL">Mọi trạng thái</option><option value="UNPAID">Chưa thanh toán</option><option value="PARTIAL">Thanh toán một phần</option><option value="PAID">Đã thanh toán</option><option value="OVERDUE">Quá hạn</option></select><input aria-label="Từ ngày" type="date" className={inputClass} value={from} onChange={(event) => setFrom(event.target.value)}/><input aria-label="Đến ngày" type="date" className={inputClass} value={to} onChange={(event) => setTo(event.target.value)}/></div>
      <CardHeader title={isReceivable ? 'Danh sách khoản phải thu' : 'Danh sách khoản phải trả'} subtitle={isReceivable ? 'Bill được xác nhận tại quầy; phần đã thu và phần còn nợ được tách riêng.' : 'Công nợ chỉ lập từ giao dịch nhập kho đã có mã chứng từ.'}/>
      <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Chứng từ gốc', isReceivable ? 'Khách hàng' : 'Nhà cung cấp', 'Ngày phát sinh', 'Hạn thanh toán', 'Tổng giá trị', isReceivable ? 'Đã thu' : 'Đã trả', isReceivable ? 'Còn phải thu' : 'Còn phải trả', 'Trạng thái', ''].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((debt) => { const currentStatus = statusOf(debt, day); return <tr key={debt.id} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-4 py-3 font-semibold">{debt.sourceId}<div className="mt-0.5 text-xs font-normal text-slate-500">{debt.sourceLabel} · {debt.demo ? 'DEMO' : debt.id}</div></td><td className="px-4 py-3">{debt.party}{debt.demo && <span className="ml-1 text-[10px] text-amber-700">DEMO</span>}</td><td className="whitespace-nowrap px-4 py-3">{dateLabel(debt.date)}</td><td className="whitespace-nowrap px-4 py-3">{dateLabel(debt.dueDate)}</td><td className="whitespace-nowrap px-4 py-3 text-right">{formatVnd(debt.amount)}</td><td className="whitespace-nowrap px-4 py-3 text-right">{formatVnd(debt.paid)}</td><td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{formatVnd(remainingOf(debt))}</td><td className="px-4 py-3"><Badge tone={currentStatus === 'PAID' ? 'green' : currentStatus === 'OVERDUE' ? 'red' : currentStatus === 'PARTIAL' ? 'blue' : 'amber'} dot>{statusLabel[currentStatus]}</Badge></td><td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={() => { setSelected(debt); setError(''); }}>Chi tiết</Button></td></tr>; })}{!rows.length && <tr><td colSpan={9} className="px-5 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><FileTextIcon className="h-5 w-5"/></div><h3 className="mt-3 font-semibold text-slate-800">Chưa có khoản công nợ phù hợp</h3><p className="mt-1 text-sm text-slate-500">Công nợ khách hàng tự sinh từ bill thu thiếu; công nợ nhà cung cấp lập từ phiếu nhập.</p></td></tr>}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>{rows.length} / {sideRows.length} chứng từ · DEMO có nhãn riêng</span><span>Số dư = Tổng chứng từ − Các lần đã thu/đã trả</span></div>
    </Card>

    <Card className="border-blue-200 bg-blue-50/60 p-4 sm:p-5"><div className="flex gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><UsersIcon className="h-4 w-4"/></div><div><h2 className="text-sm font-semibold text-blue-950">Liên kết chứng từ và thanh toán</h2><p className="mt-1 text-sm leading-6 text-blue-900/80">Bill khách hàng được ghi công nợ ngay khi thu ngân xác nhận bill có số tiền thu nhỏ hơn tổng bill. Công nợ nhà cung cấp phải chọn giao dịch nhập kho. Mỗi lần tất toán tạo phiếu thu/chi dòng tiền gắn với mã công nợ, không ghi nhận trùng doanh thu/chi phí.</p><div className="mt-3 flex flex-wrap gap-2">{isReceivable ? <Link to="/invoices"><Button size="sm" variant="secondary">Mở lịch sử hóa đơn</Button></Link> : <Link to="/receive"><Button size="sm" variant="secondary">Mở nhập hàng</Button></Link>}<Link to="/accountant/cash-vouchers"><Button size="sm" variant="ghost">Mở phiếu thu, chi</Button></Link></div></div></div></Card>

    {createOpen && <Modal open onClose={() => setCreateOpen(false)} title="Lập công nợ phải trả" description="Chọn giao dịch nhập kho làm chứng từ gốc; số tiền lấy từ giá trị phiếu nhập." footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Hủy</Button><Button onClick={submitCreate} disabled={!sourceTxId || !dueDate}>Lưu công nợ</Button></>}>
      <div className="space-y-4"><Field label="Phiếu nhập kho gốc"><select className={inputClass} value={sourceTxId} onChange={(event) => setSourceTxId(event.target.value)}><option value="">Chọn phiếu nhập chưa lập công nợ</option>{availableReceipts.map((tx) => <option key={tx.id} value={tx.id}>{tx.id} · {txDescription(tx)}</option>)}</select></Field>{selectedTx && <div className="rounded-xl bg-slate-50 p-3 text-sm"><p><strong>Chứng từ nguồn:</strong> {selectedTx.id} · lô {selectedTx.batchId}</p><p className="mt-1"><strong>Giá trị phải trả:</strong> {formatVnd(selectedTx.value)}</p><p className="mt-1"><strong>Ngày nhập:</strong> {dateLabel(selectedTx.at.slice(0,10))}</p></div>}<Field label="Hạn thanh toán"><input type="date" className={inputClass} value={dueDate} onChange={(event) => setDueDate(event.target.value)}/></Field>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}{!availableReceipts.length && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Không còn giao dịch nhập kho chưa lập công nợ.</p>}</div>
    </Modal>}

    {detailRecord && <Modal open onClose={() => { setSelected(null); setError(''); }} title={`Công nợ · ${detailRecord.id}`} description={`${detailRecord.sourceLabel} · nguồn ${detailRecord.sourceId}`} width="max-w-2xl" footer={<><Button variant="secondary" onClick={() => { setSelected(null); setError(''); }}>Đóng</Button>{remainingOf(detailRecord) > 0 && <Button onClick={() => setPayAmount(String(remainingOf(detailRecord)))}>Ghi nhận thanh toán</Button>}</>}>
      <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><Badge tone={detailRecord.demo ? 'amber' : 'blue'} dot>{detailRecord.demo ? 'DEMO · Có nguồn chứng từ' : 'Chứng từ thực tế'}</Badge><Badge tone={statusOf(detailRecord, day) === 'PAID' ? 'green' : statusOf(detailRecord, day) === 'OVERDUE' ? 'red' : statusOf(detailRecord, day) === 'PARTIAL' ? 'blue' : 'amber'}>{statusLabel[statusOf(detailRecord, day)]}</Badge></div><dl className="grid gap-3 sm:grid-cols-2">{[[isReceivable ? 'Khách hàng' : 'Nhà cung cấp', detailRecord.party], ['Mã chứng từ nguồn', detailRecord.sourceId], ['Ngày phát sinh', dateLabel(detailRecord.date)], ['Hạn thanh toán', dateLabel(detailRecord.dueDate)], ['Tổng giá trị', formatVnd(detailRecord.amount)], [isReceivable ? 'Đã thu' : 'Đã trả', formatVnd(detailRecord.paid)], [isReceivable ? 'Còn phải thu' : 'Còn phải trả', formatVnd(remainingOf(detailRecord))]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl>
        {sourceOrder && <Button size="sm" variant="secondary" onClick={() => { setSourceInvoice(sourceOrder); setSelected(null); }}>Xem bill gốc</Button>}
        {sourceTx && sourceBatch && <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm"><p className="font-semibold">Chi tiết phiếu nhập gốc · {sourceTx.id}</p><p className="mt-1">{ingredientOf(sourceTx.ingredientId).name} · {sourceTx.qty} {sourceTx.unit} × {formatVnd(sourceBatch.unitCost)}</p><p className="mt-1 text-xs text-slate-600">Lô {sourceBatch.id} · nhà cung cấp {detailRecord.party}</p></div>}
        {detailRecord.contact && <p className="text-sm text-slate-600">Liên hệ: {detailRecord.contact}</p>}
        {detailRecord.payments.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">Lịch sử thanh toán</h3><div className="space-y-2">{detailRecord.payments.map((payment) => { const voucher = cashLedger.vouchers.find((item) => item.id === payment.voucherId || item.id === payment.id); return <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-3 text-sm"><span>{dateLabel(payment.date)} · {payment.method}</span><div className="flex items-center gap-3"><strong>{formatVnd(payment.amount)}</strong>{voucher ? <Button size="sm" variant="secondary" onClick={() => setSelectedVoucher(voucher)}>Mở {voucher.id}</Button> : <span className="text-xs text-slate-400">Trong bill gốc</span>}</div></div>; })}</div></div>}
        {remainingOf(detailRecord) > 0 && <div className="rounded-xl border border-slate-200 p-4"><h3 className="mb-3 text-sm font-semibold">Ghi nhận thu / trả tiếp</h3><div className="grid gap-3 sm:grid-cols-2"><Field label="Số tiền"><input type="number" min="1" max={remainingOf(detailRecord)} className={inputClass} value={payAmount} onChange={(event) => setPayAmount(event.target.value)} placeholder={`Tối đa ${remainingOf(detailRecord)}`}/></Field><Field label="Phương thức"><select className={inputClass} value={payMethod} onChange={(event) => setPayMethod(event.target.value as CashVoucherMethod)}><option>Tiền mặt</option><option>Chuyển khoản</option></select></Field></div><p className="mt-2 text-xs leading-5 text-slate-500">Lưu thành công sẽ cập nhật số dư công nợ và tạo phiếu thu/chi gắn với khoản này.</p>{error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}<Button className="mt-3" onClick={submitPayment} disabled={!Number(payAmount) || Number(payAmount) > remainingOf(detailRecord)}>Xác nhận thu / trả</Button></div>}
      </div>
    </Modal>}
    <InvoiceModal order={sourceInvoice} title={sourceInvoice ? `Bill gốc ${sourceInvoice.id}` : undefined} onClose={() => setSourceInvoice(null)} />
    {selectedVoucher && <Modal open onClose={() => setSelectedVoucher(null)} title={`${selectedVoucher.type === 'RECEIPT' ? 'Phiếu thu' : 'Phiếu chi'} ${selectedVoucher.id}`} description={`Liên kết công nợ ${selectedVoucher.debtId ?? '—'} · chứng từ nguồn ${selectedVoucher.sourceDocumentId ?? '—'}`} footer={<Button variant="secondary" onClick={() => setSelectedVoucher(null)}>Đóng</Button>}><dl className="grid gap-3 sm:grid-cols-2">{[['Ngày lập', dateLabel(selectedVoucher.date.slice(0,10))], ['Đối tượng', selectedVoucher.partyName], ['Nội dung', selectedVoucher.reason], ['Phương thức', selectedVoucher.method], ['Số tiền', formatVnd(selectedVoucher.amount)], ['Trạng thái', selectedVoucher.status], ['Diễn giải', selectedVoucher.description]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl></Modal>}
  </div>;
}

function DebtMetric({ title, value, note, icon, tone }: { title: string; value: string; note: string; icon: ReactNode; tone: 'blue' | 'orange' | 'amber' | 'red' | 'green' }) {
  const styles = { blue: 'bg-blue-50 text-blue-700', orange: 'bg-orange-50 text-orange-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', green: 'bg-emerald-50 text-emerald-700' };
  return <Card className="p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{title}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}>{icon}</span></div><p className="mt-3 text-xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></Card>;
}
