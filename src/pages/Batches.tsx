import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackagePlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { StateBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DisposeModal } from '../components/inventory/DisposeModal';
import { useApp } from '../contexts/AppContext';
import { formatDate, formatQty, formatVnd } from '../utils/format';
import { availableQty, batchState, countdownLabel } from '../utils/inventory';
import type { Batch } from '../types';

const FILTERS = [
'Tất cả',
'Còn hạn',
'Sắp hết hạn',
'Đã hết hạn',
'Sắp hết hàng',
'Hết hàng',
'Đã hủy'] as
const;

export function Batches() {
  const { batches, ingredientOf, suppliers } = useApp();
  const [filter, setFilter] = useState<string>('Tất cả');
  const [query, setQuery] = useState('');
  const [disposing, setDisposing] = useState<Batch | null>(null);

  const rows = batches.filter((b) => {
    const ing = ingredientOf(b.ingredientId);
    const state = batchState(b);
    const avail = availableQty(batches, b.ingredientId);
    const matchFilter =
    filter === 'Tất cả' ?
    true :
    filter === 'Còn hạn' ?
    state === 'FRESH' :
    filter === 'Sắp hết hạn' ?
    state === 'NEAR_EXPIRY' :
    filter === 'Đã hết hạn' ?
    state === 'EXPIRED' :
    filter === 'Đã hủy' ?
    state === 'CANCELLED' :
    filter === 'Sắp hết hàng' ?
    avail < ing.minStock && avail > 0 :
    avail <= 0;
    const q = query.toLowerCase();
    const matchQuery =
    !q ||
    b.id.toLowerCase().includes(q) ||
    b.barcode.includes(q) ||
    ing.name.toLowerCase().includes(q);
    return matchFilter && matchQuery;
  });

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Lô hàng"
        subtitle="Mọi nguyên liệu được quản lý theo batch/lot — không gộp tổng số lượng"
        action={
        <Link to="/receive">
            <Button>
              <PackagePlusIcon className="h-4 w-4" />
              + NHẬP HÀNG
            </Button>
          </Link>
        } />
      

      <Card>
        <CardHeader
          title={`${rows.length} lô hàng`}
          subtitle="Nhấn Xử lý hủy để loại lô khỏi tồn kho khả dụng"
          action={
          <div className="relative w-80">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nguyên liệu / mã lô / mã barcode"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
            
            </div>
          } />
        

        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-5 py-3">
          {FILTERS.map((f) =>
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out ${
            filter === f ?
            'bg-slate-900 text-white' :
            'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
            }>
            
              {f}
            </button>
          )}
        </div>

        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-medium">Mã lô</th>
                <th className="px-5 py-2.5 font-medium">Nguyên liệu</th>
                <th className="px-5 py-2.5 text-right font-medium">Số lượng</th>
                <th className="px-5 py-2.5 font-medium">Nhà cung cấp</th>
                <th className="px-5 py-2.5 font-medium">Ngày nhập</th>
                <th className="px-5 py-2.5 font-medium">Hạn sử dụng</th>
                <th className="px-5 py-2.5 text-right font-medium">Giá nhập</th>
                <th className="px-5 py-2.5 font-medium">Trạng thái</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((b) => {
                const ing = ingredientOf(b.ingredientId);
                const state = batchState(b);
                return (
                  <tr
                    key={b.id}
                    className={
                    state === 'CANCELLED' ? 'bg-slate-50 text-slate-400' : ''
                    }>
                    
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {b.id}
                      <span className="tabular ml-2 text-xs text-slate-400">
                        {b.barcode}
                      </span>
                    </td>
                    <td className="px-5 py-3">{ing.name}</td>
                    <td className="tabular px-5 py-3 text-right font-medium">
                      {formatQty(b.quantity, ing.unit)}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {suppliers.find((s) => s.id === b.supplierId)?.name}
                    </td>
                    <td className="tabular px-5 py-3 text-slate-500">
                      {formatDate(b.receivedAt)}
                    </td>
                    <td className="tabular px-5 py-3">
                      {formatDate(b.expiryDate)}
                      <span className="ml-2 text-xs text-slate-400">
                        {state !== 'CANCELLED' && countdownLabel(b.expiryDate)}
                      </span>
                    </td>
                    <td className="tabular px-5 py-3 text-right">
                      {formatVnd(b.unitCost)}
                    </td>
                    <td className="px-5 py-3">
                      <StateBadge state={state} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {state !== 'CANCELLED' &&
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDisposing(b)}>
                        
                          <Trash2Icon className="h-3.5 w-3.5" />
                          Xử lý hủy
                        </Button>
                      }
                    </td>
                  </tr>);

              })}
              {rows.length === 0 &&
              <tr>
                  <td
                  colSpan={9}
                  className="px-5 py-12 text-center text-sm text-slate-500">
                  
                    Không có lô hàng nào khớp bộ lọc.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </Card>

      <DisposeModal batch={disposing} onClose={() => setDisposing(null)} />
    </div>);

}
