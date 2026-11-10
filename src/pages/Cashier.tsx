import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BanknoteIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  CreditCardIcon,
  PrinterIcon,
  QrCodeIcon,
  ScrollTextIcon,
  ArrowLeftIcon,
  UsersIcon } from
'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { InvoiceModal } from '../components/cashier/InvoiceModal';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Field, inputClass } from '../components/ui/Field';
import { formatVnd } from '../utils/format';
import {
  LINE_LABEL,
  LINE_TONE,
  isReadyToPay,
  minutesSince,
  orderTotals,
  submittedLines } from
'../utils/order';
import type { Order, PaymentMethod } from '../types';
import { billableQty } from '../utils/order';

const METHODS: {id: PaymentMethod;icon: React.ComponentType<{className?: string;}>;}[] = [
{ id: 'Tiền mặt', icon: BanknoteIcon },
{ id: 'Chuyển khoản', icon: QrCodeIcon },
{ id: 'Thẻ', icon: CreditCardIcon }];


export function Cashier() {
  const { orders, dishes, tableOf, areas, tables, payOrder, completeDirectSale, showToast, cashierShifts, openCashierShift, closeCashierShift } = useApp();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedScreen = searchParams.get('screen') === 'available' ? 'available' : searchParams.get('screen') === 'shift' ? 'shift' : 'payment';
  const [areaId, setAreaId] = useState(areas[0]?.id ?? '');
  const [showPayment, setShowPayment] = useState(false);

  const open = orders.
  filter((o) => o.status === 'OPEN' && submittedLines(o).length > 0).
  sort((a, b) => Number(isReadyToPay(b)) - Number(isReadyToPay(a)));
  const availableLines = orders.flatMap((order) => order.status === 'OPEN' ? order.lines
    .filter((line) => line.status === 'CASHIER_PENDING' && dishes.find((dish) => dish.id === line.dishId)?.readyMade)
    .map((line) => ({ order, line })) : []);

  const [selectedId, setSelectedId] = useState<string | null>(open[0]?.id ?? null);
  const [discountRate, setDiscountRate] = useState(0);
  const [allowDebt, setAllowDebt] = useState(false);
  const [paidNow, setPaidNow] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Tiền mặt');
  const [cash, setCash] = useState('');
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [provisional, setProvisional] = useState<Order | null>(null);
  const [openingCash,setOpeningCash]=useState(''); const [openingNote,setOpeningNote]=useState(''); const [actualCash,setActualCash]=useState(''); const [varianceReason,setVarianceReason]=useState(''); const [shiftError,setShiftError]=useState('');
  const activeShift=cashierShifts.find(s=>s.cashier===user?.name&&s.status==='OPEN');
  const anotherOpenShift=cashierShifts.find(s=>s.status==='OPEN'&&s.cashier!==user?.name);
  const screen = activeShift ? requestedScreen : 'shift';

  const startShift = () => {
    const err = openCashierShift(Number(openingCash), openingNote);
    setShiftError(err ?? '');
    if (!err) { setOpeningCash(''); setOpeningNote(''); navigate('/cashier'); }
  };

  const selected = open.find((o) => o.id === selectedId) ?? open[0];

  useEffect(() => {
    setDiscountRate(0);
    setCash('');
    setMethod('Tiền mặt');
    setAllowDebt(false);
    setPaidNow('');
    setCustomerName('');
    setCustomerPhone('');
  }, [selected?.id]);

  const cashierSales = activeShift ? orders.filter((order) =>
    order.status === 'PAID' && order.paidBy === user?.name && !!order.paidAt &&
    order.paidAt >= activeShift.openedAt && (!activeShift.closedAt || order.paidAt <= activeShift.closedAt)
  ) : [];
  const shiftRevenue = cashierSales.reduce((s, o) => s + (o.paidAmount ?? o.total), 0);
  const shiftCash = cashierSales.filter((o) => o.paymentMethod === 'Tiền mặt').reduce((s, o) => s + (o.paidAmount ?? o.total), 0);
  const shiftTransfer = cashierSales.filter((o) => o.paymentMethod === 'Chuyển khoản').reduce((s, o) => s + (o.paidAmount ?? o.total), 0);
  const shiftCard = cashierSales.filter((o) => o.paymentMethod === 'Thẻ').reduce((s, o) => s + (o.paidAmount ?? o.total), 0);
  const expectedCash=(activeShift?.openingCash??0)+shiftCash;

  const lines = selected ? submittedLines(selected) : [];
  const totals = orderTotals(lines, discountRate);
  const waiting = lines.filter((l) => billableQty(l) > 0 && l.status !== 'READY');
  const ready = selected ? isReadyToPay(selected) : false;
  const cashNum = Number(cash) || 0;
  const amountToCollect = allowDebt ? (paidNow.trim() === '' ? 0 : Number(paidNow)) : totals.total;
  const amountValid = Number.isFinite(amountToCollect) && amountToCollect >= 0 && amountToCollect <= totals.total;
  const debtCustomerValid = amountToCollect >= totals.total || customerName.trim().length > 0;
  const cashOk = method !== 'Tiền mặt' || amountToCollect === 0 || cashNum >= amountToCollect;
  const quick = [totals.total, Math.ceil(totals.total / 100_000) * 100_000, Math.ceil(totals.total / 500_000) * 500_000].
  filter((v, i, a) => a.indexOf(v) === i);

  const pay = () => {
    if (!selected) return;
    const paid = payOrder(selected.id, {
      discountRate,
      method,
      cashReceived: method === 'Tiền mặt' ? cashNum : undefined,
      amountPaid: amountToCollect,
      customerName,
      customerPhone
    });
    if (paid) {
      setInvoice(paid);
      showToast(paid.debtAmount ? `Đã xác nhận bill ${paid.id}; ghi công nợ ${formatVnd(paid.debtAmount)}` : `Đã thanh toán ${paid.id} — đã trừ định lượng nguyên liệu`);
      setSelectedId(null);
    }
  };

  const closeShift = () => {
    if (!activeShift) return;
    if (actualCash.trim() === '') { setShiftError('Nhập số tiền mặt thực tế đang có trong két.'); return; }
    const error = closeCashierShift(activeShift.id, Number(actualCash), varianceReason, {
      cash: shiftCash, transfer: shiftTransfer, other: shiftCard
    });
    setShiftError(error ?? '');
    if (!error) {
      setActualCash('');
      setVarianceReason('');
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      {!activeShift && screen !== 'shift' ? <div className="m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-card"><h2 className="text-xl font-bold">Chưa mở ca thu ngân</h2><p className="mt-1 text-sm text-slate-500">Mở ca tại chức năng Chốt ca trước khi thanh toán.</p><Link to="/cashier?screen=shift"><Button className="mt-4">Đi đến Chốt ca</Button></Link></div> : <>
      {screen === 'shift' ? <section className="m-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-xl font-bold">Chốt ca thu ngân</h1>
        {!activeShift ? anotherOpenShift ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Thu ngân {anotherOpenShift.cashier} đang mở ca {anotherOpenShift.id}. Chốt ca đó trước khi mở ca mới.</p> : <><p className="mt-1 text-sm text-slate-500">Nhập tiền mặt đầu ca để bắt đầu ca làm việc.</p><div className="mt-5 space-y-3"><Field label="Tiền mặt đầu ca"><input className={inputClass} type="number" min="0" value={openingCash} onChange={e=>setOpeningCash(e.target.value)}/></Field><Field label="Ghi chú"><textarea className={inputClass} value={openingNote} onChange={e=>setOpeningNote(e.target.value)}/></Field>{shiftError&&<p className="text-sm text-red-600">{shiftError}</p>}<Button onClick={startShift}>Xác nhận mở ca</Button></div></> : <><p className="mt-1 text-sm text-slate-500">Ca {activeShift.id} · Mở lúc {new Date(activeShift.openedAt).toLocaleString('vi-VN')}</p><div className="mt-5 space-y-3 text-sm"><p>Thu ngân: <strong>{user?.name}</strong></p><p>Tiền mặt đầu ca: <strong>{formatVnd(activeShift.openingCash)}</strong></p><p>Doanh thu tiền mặt: <strong>{formatVnd(shiftCash)}</strong></p><p>Chuyển khoản: <strong>{formatVnd(shiftTransfer)}</strong> · Phương thức khác: <strong>{formatVnd(shiftCard)}</strong></p><p>Tiền mặt dự kiến cuối ca: <strong>{formatVnd(expectedCash)}</strong></p><Field label="Tiền mặt thực tế kiểm đếm trong két"><input className={inputClass} type="number" min="0" value={actualCash} onChange={e=>setActualCash(e.target.value)}/></Field><p>Chênh lệch: <strong>{formatVnd((Number(actualCash)||0)-expectedCash)}</strong></p><Field label="Lý do chênh lệch (bắt buộc nếu khác 0)"><textarea className={inputClass} value={varianceReason} onChange={e=>setVarianceReason(e.target.value)}/></Field>{shiftError&&<p role="alert" className="text-red-600">{shiftError}</p>}<Button variant="warning" onClick={closeShift}>Xác nhận chốt ca và gửi báo cáo</Button></div></>}
      </section> : <>
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sơ đồ bàn</h1>
          <p className="text-xs text-slate-500">{tables.filter((table) => open.some((order) => order.tableId === table.id)).length}/{tables.length} bàn đang có khách · Chọn bàn để xem order và xác nhận thanh toán</p>
        </div>
        <div className="ml-auto flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-start">
          <dl className="flex w-full justify-between gap-3 text-sm sm:w-auto sm:gap-6 lg:gap-8">
          <div>
            <dt className="text-xs text-slate-500">Tiền đã thu trong ca · {user?.name}</dt>
            <dd className="tabular font-semibold text-slate-900">{formatVnd(shiftRevenue)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Bill đã xác nhận</dt>
            <dd className="tabular font-semibold text-slate-900">{cashierSales.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Bàn đang mở</dt>
            <dd className="tabular font-semibold text-slate-900">{open.length}</dd>
          </div>
          </dl>
          <div className="w-full text-xs text-slate-500">Ca {activeShift?.id} · Đầu ca {formatVnd(activeShift?.openingCash ?? 0)} · Tiền mặt {formatVnd(shiftCash)} · Chuyển khoản {formatVnd(shiftTransfer)} · Thẻ {formatVnd(shiftCard)} · Dự kiến trong két {formatVnd(expectedCash)}</div>
        </div>
        <Link to="/invoices">
          <Button variant="secondary">
            <ScrollTextIcon className="h-4 w-4" />
            Lịch sử hóa đơn
          </Button>
        </Link>
        <Link to="/reports">
          <Button variant="secondary"><BarChart3Icon className="h-4 w-4" /> Báo cáo</Button>
        </Link>
      </div>

      {screen === 'available' ? (
        <section className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          <div className="mb-4"><h2 className="text-lg font-bold text-slate-900">Sản phẩm có sẵn chờ xác nhận</h2><p className="mt-1 text-sm text-slate-500">Nước và sản phẩm bán trực tiếp được chuyển đến đây sau khi phục vụ gửi order. Chỉ xác nhận xong mới thành sẵn sàng phục vụ.</p></div>
          {availableLines.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Không có sản phẩm có sẵn đang chờ xử lý.</div> :
            <div className="grid gap-3 xl:grid-cols-2">{availableLines.map(({ order, line }) => (
              <article key={`${order.id}:${line.lineId}`} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-brand-700">{tableOf(order.tableId)?.name} · {order.id}</p><h3 className="mt-1 font-bold text-slate-900">{line.name} <span className="text-slate-500">× {billableQty(line)}</span></h3>{line.note && <p className="mt-1 text-xs text-amber-700">Ghi chú: {line.note}</p>}<p className="mt-1 text-xs text-slate-400">Phục vụ: {order.createdBy}</p></div>
                <Badge tone="amber" dot>Chờ xác nhận</Badge>
                <Button onClick={() => completeDirectSale(order.id, line.lineId)}><CheckCircle2Icon className="h-4 w-4" /> Xác nhận hoàn thành</Button>
              </article>
            ))}</div>}
        </section>
      ) : (
      <>
      {!showPayment && <div className="bg-slate-50 px-5 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {areas.map((area) => {
            const areaTables = tables.filter((table) => table.areaId === area.id);
            const occupied = areaTables.filter((table) => open.some((order) => order.tableId === table.id)).length;
            return <button key={area.id} onClick={() => setAreaId(area.id)} className={`rounded-full px-4 py-2 text-sm ${areaId === area.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
              {area.name} <span className={`ml-1 text-xs ${areaId === area.id ? 'text-slate-300' : 'text-slate-400'}`}>{occupied}/{areaTables.length}</span>
            </button>;
          })}
          <div className="ml-auto flex items-center gap-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white"/>Trống</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-brand-600"/>Có khách</span></div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          {(tables.filter((table) => table.areaId === areaId).length === 0) ? <p className="py-10 text-center text-sm text-slate-500">Khu vực chưa có bàn.</p> :
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {tables.filter((table) => table.areaId === areaId).map((table) => {
                const order = open.find((item) => item.tableId === table.id);
                const busy = !!order;
                const selectedTable = selected?.tableId === table.id;
                const items = order ? submittedLines(order).reduce((sum, line) => sum + billableQty(line), 0) : 0;
                return <button key={table.id} disabled={!order} onClick={() => { if (order) { setSelectedId(order.id); setShowPayment(true); } }} className={`flex aspect-[0.9/1] flex-col justify-between rounded-xl border-2 p-4 text-left transition-colors ${busy ? `border-brand-600 bg-brand-600 text-white hover:bg-brand-700 ${selectedTable ? 'ring-4 ring-brand-200' : ''}` : 'cursor-default border-dashed border-slate-300 bg-white text-slate-700'}`}>
                  <div className="flex items-start justify-between gap-2"><span className="text-lg font-semibold">{table.name}</span><span className={`flex items-center gap-1 text-xs ${busy ? 'text-brand-100' : 'text-slate-400'}`}><UsersIcon className="h-3.5 w-3.5"/>{table.seats}</span></div>
                  <div><p className="text-sm font-medium">{busy ? 'Có khách' : 'Trống'}</p><p className={`text-xs ${busy ? 'text-brand-100' : 'text-slate-400'}`}>{busy ? `${minutesSince(order!.createdAt)} phút · ${items} món` : 'Chưa có order'}</p>{busy && <p className="mt-1 text-xs font-medium">{isReadyToPay(order!) ? 'Sẵn sàng thanh toán' : 'Đang chờ chế biến'}</p>}</div>
                </button>;
              })}
            </div>}
        </div>

      </div>}

      {showPayment && selected ?
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50 p-5 sm:p-6">
          <Button variant="secondary" className="mb-4 self-start" onClick={() => setShowPayment(false)}><ArrowLeftIcon className="h-4 w-4"/>Quay lại sơ đồ bàn</Button>
          <div className="flex min-w-0 flex-1 flex-col bg-slate-50 lg:flex-row">
            <section className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{tableOf(selected.tableId)?.name}</h2>
                  <p className="text-xs text-slate-500">{selected.id} · Phục vụ: {selected.createdBy}</p>
                </div>
                <Button
                variant="secondary"
                size="sm"
                onClick={() => setProvisional({ ...selected, discountRate })}>
                
                  <PrinterIcon className="h-3.5 w-3.5" />
                  In tạm tính
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto scroll-thin">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-2.5 font-medium">Món</th>
                      <th className="px-3 py-2.5 text-right font-medium">SL</th>
                      <th className="px-3 py-2.5 text-right font-medium">Đơn giá</th>
                      <th className="px-3 py-2.5 text-right font-medium">Thành tiền</th>
                      <th className="px-6 py-2.5 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                      {lines.map((l) =>
                  <tr key={l.lineId}>
                        <td className="px-6 py-3">
                          <p className="font-medium text-slate-900">{l.name}</p>
                          {billableQty(l) < l.qty && <p className="text-xs text-red-600">Đã hủy {l.qty - billableQty(l)}</p>}
                          {l.note && <p className="text-xs text-amber-700">{l.note}</p>}
                        </td>
                        <td className="tabular px-3 py-3 text-right">{billableQty(l)}</td>
                        <td className="tabular px-3 py-3 text-right text-slate-500">{formatVnd(l.price)}</td>
                        <td className="tabular px-3 py-3 text-right font-medium">{formatVnd(l.price * billableQty(l))}</td>
                        <td className="px-6 py-3">
                          <Badge tone={LINE_TONE[l.status]} dot>{LINE_LABEL[l.status]}</Badge>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="flex w-full shrink-0 flex-col border-l border-slate-200 bg-white lg:w-[360px]">
              <div className="flex-1 space-y-5 overflow-y-auto scroll-thin px-5 py-5">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <dt>Tạm tính</dt>
                    <dd className="tabular">{formatVnd(totals.subtotal)}</dd>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <dt>Giảm giá</dt>
                    <dd className="flex items-center gap-2">
                      <div className="flex rounded-lg bg-slate-100 p-0.5">
                        {[0, 5, 10, 15].map((r) =>
                      <button
                        key={r}
                        onClick={() => setDiscountRate(r)}
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        discountRate === r ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500'}`
                        }>
                        
                            {r}%
                          </button>
                      )}
                      </div>
                    </dd>
                  </div>
                  {totals.discount > 0 &&
                <div className="flex justify-between text-red-600">
                      <dt />
                      <dd className="tabular">−{formatVnd(totals.discount)}</dd>
                    </div>
                }
                  <div className="flex justify-between text-slate-600">
                    <dt>VAT 8%</dt>
                    <dd className="tabular">{formatVnd(totals.vat)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
                    <dt className="font-semibold text-slate-900">Tổng tiền</dt>
                    <dd className="tabular text-2xl font-semibold text-slate-900">{formatVnd(totals.total)}</dd>
                  </div>
                </dl>

                <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <input type="checkbox" checked={allowDebt} onChange={(event) => { setAllowDebt(event.target.checked); setPaidNow(event.target.checked ? String(totals.total) : ''); }} className="mt-0.5 accent-amber-600" />
                  <span><strong className="block text-amber-900">Ghi nợ / thanh toán một phần</strong><span className="mt-0.5 block text-xs leading-5 text-amber-800">Bill vẫn được xác nhận; số còn thiếu sẽ tự tạo công nợ gắn với mã hóa đơn.</span></span>
                </label>

                {allowDebt && <div className="mt-3 rounded-lg border border-slate-200 p-3">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="paid-now">Số tiền thu ngay</label>
                  <input id="paid-now" type="number" min="0" max={totals.total} step="1000" value={paidNow} onChange={(event) => setPaidNow(event.target.value)} className={inputClass + ' text-right font-semibold'} />
                  {!amountValid && <p className="mt-1 text-xs text-red-600">Số tiền thu không được vượt tổng bill.</p>}
                  {amountValid && <p className="mt-1 flex justify-between text-xs text-amber-800"><span>Ghi công nợ</span><strong>{formatVnd(totals.total - amountToCollect)}</strong></p>}
                  {amountToCollect < totals.total && <div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-xs font-medium text-slate-600">Tên khách hàng *<input className={inputClass + ' mt-1'} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nhập tên người nợ" /></label><label className="text-xs font-medium text-slate-600">Số điện thoại<input className={inputClass + ' mt-1'} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Không bắt buộc" /></label></div>}
                </div>}

                <div>
                  <p className="mb-2 text-xs font-medium text-slate-600">Phương thức thanh toán</p>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map((mt) =>
                  <button
                    key={mt.id}
                    disabled={allowDebt && mt.id === 'Thẻ'}
                    title={allowDebt && mt.id === 'Thẻ' ? 'Ghi nợ hiện chỉ hỗ trợ tiền mặt hoặc chuyển khoản' : undefined}
                    onClick={() => setMethod(mt.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors duration-150 ease-out ${
                    allowDebt && mt.id === 'Thẻ' ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300' : method === mt.id ?
                    'border-brand-600 bg-brand-50 text-brand-700' :
                    'border-slate-200 text-slate-600 hover:bg-slate-50'}`
                    }>
                    
                        <mt.icon className="h-4 w-4" />
                        {mt.id}
                      </button>
                  )}
                  </div>
                </div>

                {method === 'Tiền mặt' &&
              <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="cash">
                      Tiền khách đưa
                    </label>
                    <input
                  id="cash"
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="0"
                  className="tabular w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-base font-semibold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {quick.map((v) =>
                  <button
                    key={v}
                    onClick={() => setCash(String(v))}
                    className="tabular rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200">
                    
                          {formatVnd(v)}
                        </button>
                  )}
                    </div>
                    {cashNum > 0 &&
                <p className={`tabular mt-2 flex justify-between text-sm ${cashOk ? 'text-emerald-700' : 'text-red-600'}`}>
                        <span>{cashOk ? 'Tiền thối' : 'Còn thiếu'}</span>
                        <span className="font-semibold">{formatVnd(Math.abs(cashNum - amountToCollect))}</span>
                      </p>
                }
                  </div>
              }

                {method === 'Chuyển khoản' &&
              <div className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-600">
                    <QrCodeIcon className="mx-auto h-16 w-16 text-slate-800" />
                    <p className="mt-2">VietQR · Sen Vàng · 0071 000 668 899</p>
                    <p className="tabular font-semibold text-slate-900">Thu ngay: {formatVnd(amountToCollect)}</p>
                  </div>
              }
              </div>

              <div className="border-t border-slate-200 px-5 py-4">
                {!ready &&
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Còn {waiting.length} món chưa hoàn thành ({waiting.map((l) => l.name).join(', ')}). Chờ bếp xong để thanh toán.
                  </p>
              }
                <Button
                size="lg"
                className="w-full"
                disabled={!ready || !cashOk || !amountValid || !debtCustomerValid}
                onClick={pay}>
                
                  <CheckCircle2Icon className="h-5 w-5" />
                  {allowDebt && totals.total - amountToCollect > 0 ? 'Xác nhận bill & ghi công nợ' : 'Xác nhận thanh toán'}
                </Button>
              </div>
            </aside>
          </div></div> :

        <div className="flex flex-1 items-center justify-center bg-slate-50" />
        }
      </>
      )}

      <InvoiceModal order={invoice} title="Thanh toán thành công" onClose={() => setInvoice(null)} />
      <InvoiceModal order={provisional} provisional onClose={() => setProvisional(null)} />
      </>}
      </>}
    </div>);

}
