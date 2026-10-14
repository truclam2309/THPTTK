import { useState } from 'react';
import { EyeIcon, PrinterIcon, SearchIcon } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { InvoiceModal } from '../components/cashier/InvoiceModal';
import { useApp } from '../contexts/AppContext';
import { formatDateTime, formatVnd } from '../utils/format';
import type { Order } from '../types';
import { billableQty } from '../utils/order';

const METHODS = ['Tất cả', 'Tiền mặt', 'Chuyển khoản', 'Thẻ'] as const;

export function Invoices() {
  const { orders, tableOf } = useApp();
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState<string>('Tất cả');
  const [viewing, setViewing] = useState<Order | null>(null);

  const paid = orders.
  filter((o) => o.status === 'PAID').
  sort((a, b) => +new Date(b.paidAt ?? 0) - +new Date(a.paidAt ?? 0));

  const rows = paid.filter((o) => {
    const q = query.toLowerCase();
    const matchQ =
    !q ||
    o.id.toLowerCase().includes(q) ||
    (tableOf(o.tableId)?.name ?? '').toLowerCase().includes(q);
    return matchQ && (method === 'Tất cả' || o.paymentMethod === method);
  });

  const byMethod = (m: string) =>
  paid.filter((o) => o.paymentMethod === m).reduce((s, o) => s + o.total, 0);

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Lịch sử hóa đơn"
        subtitle="Tra cứu, xem lại và in lại hóa đơn đã thanh toán trong ca" />
      

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="px-5 py-4">
          <p className="text-xs text-slate-500">Tổng thu</p>
          <p className="tabular mt-1 text-xl font-semibold text-slate-900">
            {formatVnd(paid.reduce((s, o) => s + o.total, 0))}
          </p>
          <p className="text-xs text-slate-400">{paid.length} hóa đơn</p>
        </Card>
        {(['Tiền mặt', 'Chuyển khoản', 'Thẻ'] as const).map((m) =>
        <Card key={m} className="px-5 py-4">
            <p className="text-xs text-slate-500">{m}</p>
            <p className="tabular mt-1 text-xl font-semibold text-slate-900">{formatVnd(byMethod(m))}</p>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader
          title={`${rows.length} hóa đơn`}
          action={
          <div className="relative w-64">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Số hóa đơn, tên bàn"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
            
            </div>
          } />
        
        <div className="flex gap-1.5 border-b border-slate-200 px-5 py-3">
          {METHODS.map((m) =>
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out ${
            method === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
            }>
            
              {m}
            </button>
          )}
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-medium">Số HĐ</th>
                <th className="px-5 py-2.5 font-medium">Bàn</th>
                <th className="px-5 py-2.5 font-medium">Thời gian</th>
                <th className="px-5 py-2.5 text-right font-medium">Số món</th>
                <th className="px-5 py-2.5 font-medium">Phương thức</th>
                <th className="px-5 py-2.5 font-medium">Thu ngân</th>
                <th className="px-5 py-2.5 text-right font-medium">Tổng tiền</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((o) =>
              <tr key={o.id}>
                  <td className="px-5 py-3 font-medium text-slate-900">{o.id}</td>
                  <td className="px-5 py-3">{tableOf(o.tableId)?.name ?? '—'}</td>
                  <td className="tabular px-5 py-3 text-slate-500">{o.paidAt && formatDateTime(o.paidAt)}</td>
                  <td className="tabular px-5 py-3 text-right">{o.lines.reduce((s, l) => s + billableQty(l), 0)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={o.paymentMethod === 'Tiền mặt' ? 'green' : o.paymentMethod === 'Thẻ' ? 'violet' : 'blue'}>
                      {o.paymentMethod}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{o.paidBy}</td>
                  <td className="tabular px-5 py-3 text-right font-semibold">{formatVnd(o.total)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setViewing(o)}>
                        <EyeIcon className="h-3.5 w-3.5" />
                        Xem
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setViewing(o)}>
                        <PrinterIcon className="h-3.5 w-3.5" />
                        In lại
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {rows.length === 0 &&
              <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                    Không có hóa đơn phù hợp.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </Card>

      <InvoiceModal order={viewing} onClose={() => setViewing(null)} />
    </div>);

}
