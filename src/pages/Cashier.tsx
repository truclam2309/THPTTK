import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BanknoteIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  CreditCardIcon,
  PrinterIcon,
  PackageCheckIcon,
  QrCodeIcon,
  ScrollTextIcon,
  WalletIcon } from
'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { InvoiceModal } from '../components/cashier/InvoiceModal';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/ui/Modal';
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
  const { orders, dishes, tableOf, payOrder, completeDirectSale, showToast, cashierShifts, openCashierShift, closeCashierShift } = useApp();
  const { user } = useAuth();
  const [screen, setScreen] = useState<'payment' | 'available'>('payment');
  const [salesDate, setSalesDate] = useState(() => new Date().toLocaleDateString('en-CA'));

  const open = orders.
  filter((o) => o.status === 'OPEN' && submittedLines(o).length > 0).
  sort((a, b) => Number(isReadyToPay(b)) - Number(isReadyToPay(a)));
  const availableLines = orders.flatMap((order) => order.status === 'OPEN' ? order.lines
    .filter((line) => line.status === 'CASHIER_PENDING' && dishes.find((dish) => dish.id === line.dishId)?.readyMade)
    .map((line) => ({ order, line })) : []);

  const [selectedId, setSelectedId] = useState<string | null>(open[0]?.id ?? null);
  const [discountRate, setDiscountRate] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('Tiền mặt');
  const [cash, setCash] = useState('');
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [provisional, setProvisional] = useState<Order | null>(null);
  const [openingCash,setOpeningCash]=useState(''); const [openingNote,setOpeningNote]=useState(''); const [actualCash,setActualCash]=useState(''); const [varianceReason,setVarianceReason]=useState(''); const [shiftError,setShiftError]=useState(''); const [closeOpen,setCloseOpen]=useState(false);
  const activeShift=cashierShifts.find(s=>s.cashier===user?.name&&s.status==='OPEN');

  const selected = open.find((o) => o.id === selectedId) ?? open[0];

  useEffect(() => {
    setDiscountRate(0);
    setCash('');
    setMethod('Tiền mặt');
  }, [selected?.id]);

  const cashierSales = orders.filter((o) =>
    o.status === 'PAID' && o.paidBy === user?.name && o.paidAt?.slice(0, 10) === salesDate
  );
  const shiftRevenue = cashierSales.reduce((s, o) => s + o.total, 0);
  const shiftCash = cashierSales.filter((o) => o.paymentMethod === 'Tiền mặt').reduce((s, o) => s + o.total, 0);
  const shiftTransfer = cashierSales.filter((o) => o.paymentMethod === 'Chuyển khoản').reduce((s, o) => s + o.total, 0);
  const shiftCard = cashierSales.filter((o) => o.paymentMethod === 'Thẻ').reduce((s, o) => s + o.total, 0);
  const expectedCash=(activeShift?.openingCash??0)+shiftCash;

  const lines = selected ? submittedLines(selected) : [];
  const totals = orderTotals(lines, discountRate);
  const waiting = lines.filter((l) => billableQty(l) > 0 && l.status !== 'READY');
  const ready = selected ? isReadyToPay(selected) : false;
  const cashNum = Number(cash) || 0;
  const cashOk = method !== 'Tiền mặt' || cashNum >= totals.total;
  const quick = [totals.total, Math.ceil(totals.total / 100_000) * 100_000, Math.ceil(totals.total / 500_000) * 500_000].
  filter((v, i, a) => a.indexOf(v) === i);

  const pay = () => {
    if (!selected) return;
    const paid = payOrder(selected.id, {
      discountRate,
      method,
      cashReceived: method === 'Tiền mặt' ? cashNum : undefined
    });
    if (paid) {
      setInvoice(paid);
      showToast(`Đã thanh toán ${paid.id} — đã trừ định lượng nguyên liệu`);
      setSelectedId(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!activeShift ? <div className="m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-card"><h2 className="text-xl font-bold">Mở ca thu ngân</h2><p className="mt-1 text-sm text-slate-500">Nhập số tiền mặt thực tế trong két. Cần mở ca trước khi thanh toán.</p><div className="mt-4 space-y-3"><Field label="Tiền mặt đầu ca"><input className={inputClass} type="number" min="0" value={openingCash} onChange={e=>setOpeningCash(e.target.value)}/></Field><Field label="Ghi chú"><textarea className={inputClass} value={openingNote} onChange={e=>setOpeningNote(e.target.value)}/></Field>{shiftError&&<p className="text-sm text-red-600">{shiftError}</p>}<Button onClick={()=>{const err=openCashierShift(Number(openingCash),openingNote);setShiftError(err??'');}}>Xác nhận mở ca</Button></div></div> : <>
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Thu ngân</h1>
          <p className="text-xs text-slate-500">Thanh toán sẽ tự động trừ định lượng nguyên liệu theo công thức</p>
        </div>
        <div className="ml-auto flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-start">
          <label className="text-xs text-slate-500">Ngày ca<input aria-label="Ngày ca cần xem" type="date" value={salesDate} onChange={(e) => setSalesDate(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800" /></label>
          <dl className="flex w-full justify-between gap-3 text-sm sm:w-auto sm:gap-6 lg:gap-8">
          <div>
            <dt className="text-xs text-slate-500">Doanh số ca · {user?.name}</dt>
            <dd className="tabular font-semibold text-slate-900">{formatVnd(shiftRevenue)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Hóa đơn đã thu</dt>
            <dd className="tabular font-semibold text-slate-900">{cashierSales.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Bàn đang mở</dt>
            <dd className="tabular font-semibold text-slate-900">{open.length}</dd>
          </div>
          </dl>
          <div className="w-full text-xs text-slate-500">Ca {activeShift.id} · Đầu ca {formatVnd(activeShift.openingCash)} · Tiền mặt {formatVnd(shiftCash)} · Chuyển khoản {formatVnd(shiftTransfer)} · Thẻ {formatVnd(shiftCard)} · Dự kiến trong két {formatVnd(expectedCash)}</div>
        </div>
        <Button variant="warning" onClick={()=>setCloseOpen(true)}>Chốt ca</Button>
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

      <div className="flex gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <Button variant={screen === 'payment' ? 'primary' : 'secondary'} onClick={() => setScreen('payment')}>
          <CreditCardIcon className="h-4 w-4" /> Order & thanh toán
        </Button>
        <Button variant={screen === 'available' ? 'primary' : 'secondary'} onClick={() => setScreen('available')}>
          <PackageCheckIcon className="h-4 w-4" /> Món có sẵn <span className="ml-1 rounded-full bg-white/20 px-1.5">{availableLines.length}</span>
        </Button>
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
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Danh sách bàn */}
        <aside className="max-h-52 w-full shrink-0 overflow-y-auto scroll-thin border-b border-slate-200 bg-white lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r">
          {open.length === 0 ?
          <div className="px-6 py-16 text-center">
              <WalletIcon className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">Không có bàn chờ thanh toán</p>
            </div> :

          <ul className="divide-y divide-slate-100">
              {open.map((o) => {
              const sl = submittedLines(o);
              const readyCount = sl.filter((l) => l.status === 'READY').length;
              const canPay = isReadyToPay(o);
              const active = selected?.id === o.id;
              return (
                <li key={o.id}>
                    <button
                    onClick={() => setSelectedId(o.id)}
                    className={`w-full px-5 py-4 text-left transition-colors duration-150 ease-out ${
                    active ? 'bg-brand-50' : 'hover:bg-slate-50'}`
                    }>
                    
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{tableOf(o.tableId)?.name}</span>
                        <span className="tabular text-sm font-semibold text-slate-900">
                          {formatVnd(orderTotals(sl).total)}
                        </span>
                      </div>
                      <p className="tabular mt-0.5 text-xs text-slate-500">
                        {o.id} · {minutesSince(o.createdAt)} phút
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                          className={`h-full rounded-full ${canPay ? 'bg-emerald-500' : 'bg-brand-500'}`}
                          style={{ width: `${readyCount / sl.length * 100}%` }} />
                        
                        </div>
                        <span className="tabular text-[11px] text-slate-500">{readyCount}/{sl.length}</span>
                      </div>
                      {canPay &&
                    <Badge tone="green" className="mt-2">Sẵn sàng thanh toán</Badge>
                    }
                    </button>
                  </li>);

            })}
            </ul>
          }
        </aside>

        {/* Chi tiết hóa đơn */}
        {selected ?
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

                <div>
                  <p className="mb-2 text-xs font-medium text-slate-600">Phương thức thanh toán</p>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map((mt) =>
                  <button
                    key={mt.id}
                    onClick={() => setMethod(mt.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors duration-150 ease-out ${
                    method === mt.id ?
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
                        <span className="font-semibold">{formatVnd(Math.abs(cashNum - totals.total))}</span>
                      </p>
                }
                  </div>
              }

                {method === 'Chuyển khoản' &&
              <div className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-600">
                    <QrCodeIcon className="mx-auto h-16 w-16 text-slate-800" />
                    <p className="mt-2">VietQR · Sen Vàng · 0071 000 668 899</p>
                    <p className="tabular font-semibold text-slate-900">{formatVnd(totals.total)}</p>
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
                disabled={!ready || !cashOk}
                onClick={pay}>
                
                  <CheckCircle2Icon className="h-5 w-5" />
                  Xác nhận thanh toán
                </Button>
              </div>
            </aside>
          </div> :

        <div className="flex flex-1 items-center justify-center bg-slate-50 text-sm text-slate-500">
            Chọn một bàn để xem hóa đơn
          </div>
        }
      </div>
      )}

      <InvoiceModal order={invoice} title="Thanh toán thành công" onClose={() => setInvoice(null)} />
      <InvoiceModal order={provisional} provisional onClose={() => setProvisional(null)} />
      <Modal open={closeOpen} onClose={()=>setCloseOpen(false)} title="Chốt ca thu ngân" description={`Ca ${activeShift.id} · Mở lúc ${new Date(activeShift.openedAt).toLocaleString('vi-VN')}`} footer={<><Button variant="secondary" onClick={()=>setCloseOpen(false)}>Hủy</Button><Button onClick={()=>{const err=closeCashierShift(activeShift.id,Number(actualCash),varianceReason,{cash:shiftCash,transfer:shiftTransfer,other:shiftCard});setShiftError(err??'');if(!err)setCloseOpen(false);}}>Xác nhận chốt ca</Button></>}>
        <div className="space-y-3 text-sm"><p>Thu ngân: <strong>{user?.name}</strong></p><p>Tiền mặt đầu ca: <strong>{formatVnd(activeShift.openingCash)}</strong></p><p>Doanh thu tiền mặt: <strong>{formatVnd(shiftCash)}</strong></p><p>Chuyển khoản: {formatVnd(shiftTransfer)} · Phương thức khác: {formatVnd(shiftCard)}</p><p>Tiền mặt dự kiến cuối ca: <strong>{formatVnd(expectedCash)}</strong></p><Field label="Tiền mặt thực tế kiểm đếm"><input className={inputClass} type="number" min="0" value={actualCash} onChange={e=>setActualCash(e.target.value)}/></Field><p>Chênh lệch: {formatVnd((Number(actualCash)||0)-expectedCash)}</p><Field label="Lý do chênh lệch (bắt buộc nếu khác 0)"><textarea className={inputClass} value={varianceReason} onChange={e=>setVarianceReason(e.target.value)}/></Field>{shiftError&&<p className="text-red-600">{shiftError}</p>}</div>
      </Modal>
      </>}
    </div>);

}
