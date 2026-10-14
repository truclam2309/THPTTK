import { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge, type Tone } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';
import { formatDateTime, formatQty, formatVnd } from '../utils/format';
import type { TxType } from '../types';

const TYPES: (TxType | 'TẤT CẢ')[] = [
'TẤT CẢ',
'NHẬP KHO',
'XUẤT KHO',
'BÁN HÀNG',
'HỦY',
'HAO HỤT',
'ĐIỀU CHỈNH'];


const TONE: Record<TxType, Tone> = {
  'NHẬP KHO': 'green',
  'XUẤT KHO': 'blue',
  'BÁN HÀNG': 'violet',
  HỦY: 'red',
  'HAO HỤT': 'orange',
  'ĐIỀU CHỈNH': 'slate'
};

export function History() {
  const { transactions, ingredientOf } = useApp();
  const [type, setType] = useState<string>('TẤT CẢ');
  const [query, setQuery] = useState('');

  const rows = transactions.
  filter((t) => type === 'TẤT CẢ' || t.type === type).
  filter((t) => {
    const q = query.toLowerCase();
    return (
      !q ||
      t.batchId.toLowerCase().includes(q) ||
      ingredientOf(t.ingredientId).name.toLowerCase().includes(q) ||
      t.reason.toLowerCase().includes(q));

  }).
  sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Lịch sử nhập – xuất – hủy"
        subtitle="Toàn bộ giao dịch kho, truy xuất theo lô và người thực hiện" />
      

      <Card>
        <CardHeader
          title={`${rows.length} giao dịch`}
          action={
          <div className="relative w-72">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã lô, nguyên liệu, lý do"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
            
            </div>
          } />
        
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-5 py-3">
          {TYPES.map((t) =>
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out ${
            type === t ?
            'bg-slate-900 text-white' :
            'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
            }>
            
              {t}
            </button>
          )}
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-medium">Thời gian</th>
                <th className="px-5 py-2.5 font-medium">Loại giao dịch</th>
                <th className="px-5 py-2.5 font-medium">Mã lô</th>
                <th className="px-5 py-2.5 font-medium">Nguyên liệu</th>
                <th className="px-5 py-2.5 text-right font-medium">Số lượng</th>
                <th className="px-5 py-2.5 font-medium">Người thực hiện</th>
                <th className="px-5 py-2.5 font-medium">Lý do</th>
                <th className="px-5 py-2.5 text-right font-medium">Giá trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) =>
              <tr key={t.id}>
                  <td className="tabular px-5 py-3 text-slate-500">
                    {formatDateTime(t.at)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={TONE[t.type]}>{t.type}</Badge>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {t.batchId}
                  </td>
                  <td className="px-5 py-3">
                    {ingredientOf(t.ingredientId).name}
                  </td>
                  <td
                  className={`tabular px-5 py-3 text-right font-medium ${
                  t.type === 'NHẬP KHO' ? 'text-emerald-600' : 'text-red-600'}`
                  }>
                  
                    {t.type === 'NHẬP KHO' ? '+' : '−'}
                    {formatQty(t.qty, t.unit)}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{t.user}</td>
                  <td className="max-w-xs truncate px-5 py-3 text-slate-600">
                    {t.reason}
                  </td>
                  <td className="tabular px-5 py-3 text-right">
                    {formatVnd(t.value)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}
