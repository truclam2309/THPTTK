import { useApp } from '../../contexts/AppContext';
import { formatDateTime, formatVnd } from '../../utils/format';
import { orderTotals, submittedLines } from '../../utils/order';
import type { Order } from '../../types';
import { billableQty } from '../../utils/order';

export function InvoiceReceipt({
  order,
  provisional = false



}: {order: Order;provisional?: boolean;}) {
  const { tableOf } = useApp();
  const lines = submittedLines(order);
  const totals = provisional ?
  orderTotals(lines, order.discountRate) :
  {
    subtotal: order.subtotal,
    discount: order.discount,
    vat: order.vat,
    total: order.total
  };
  const change =
  order.paymentMethod === 'Tiền mặt' && order.cashReceived ?
  order.cashReceived - order.total :
  0;

  return (
    <div className="print-area mx-auto w-full max-w-[320px] bg-white font-mono text-[12px] leading-relaxed text-slate-900">
      <div className="text-center">
        <p className="text-sm font-bold">NHÀ HÀNG SEN VÀNG</p>
        <p>128 Nguyễn Huệ, Q.1, TP.HCM</p>
        <p>ĐT: 028 3822 6688</p>
        <p className="mt-2 text-sm font-bold">
          {provisional ? 'PHIẾU TẠM TÍNH' : 'HÓA ĐƠN THANH TOÁN'}
        </p>
      </div>
      <div className="mt-2 border-t border-dashed border-slate-400 pt-2">
        <p>Số: {order.id}</p>
        <p>Bàn: {tableOf(order.tableId)?.name ?? order.tableId}</p>
        <p>Giờ vào: {formatDateTime(order.createdAt)}</p>
        {order.paidAt && <p>Giờ TT: {formatDateTime(order.paidAt)}</p>}
        {order.paidBy && <p>Thu ngân: {order.paidBy}</p>}
      </div>
      <table className="mt-2 w-full border-t border-dashed border-slate-400">
        <thead>
          <tr className="text-left">
            <th className="py-1 font-bold">Món</th>
            <th className="py-1 text-right font-bold">SL</th>
            <th className="py-1 text-right font-bold">T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) =>
          <tr key={l.lineId} className="align-top">
              <td className="py-0.5 pr-2">
                {l.name}
                {billableQty(l) < l.qty && <span className="text-red-600"> · Đã hủy {l.qty - billableQty(l)}</span>}
                <br />
                <span className="text-slate-500">@{formatVnd(l.price)}</span>
              </td>
              <td className="py-0.5 text-right">{billableQty(l)}</td>
              <td className="py-0.5 text-right">{formatVnd(l.price * billableQty(l))}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-2 space-y-0.5 border-t border-dashed border-slate-400 pt-2">
        <p className="flex justify-between"><span>Tạm tính</span><span>{formatVnd(totals.subtotal)}</span></p>
        {totals.discount > 0 &&
        <p className="flex justify-between"><span>Giảm giá ({order.discountRate}%)</span><span>-{formatVnd(totals.discount)}</span></p>
        }
        <p className="flex justify-between"><span>VAT 8%</span><span>{formatVnd(totals.vat)}</span></p>
        <p className="flex justify-between text-sm font-bold"><span>TỔNG CỘNG</span><span>{formatVnd(totals.total)}</span></p>
        {order.paymentMethod &&
        <p className="flex justify-between"><span>Thanh toán</span><span>{order.paymentMethod}</span></p>
        }
        {order.cashReceived ?
        <>
            <p className="flex justify-between"><span>Khách đưa</span><span>{formatVnd(order.cashReceived)}</span></p>
            <p className="flex justify-between"><span>Tiền thối</span><span>{formatVnd(change)}</span></p>
          </> :
        null}
      </div>
      <p className="mt-3 border-t border-dashed border-slate-400 pt-2 text-center">
        {provisional ? 'Phiếu chưa phải hóa đơn thanh toán' : 'Cảm ơn quý khách — hẹn gặp lại!'}
      </p>
    </div>);

}
