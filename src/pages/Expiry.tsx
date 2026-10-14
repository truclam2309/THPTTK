import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FlameIcon, Trash2Icon } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge, StateBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { DisposeModal } from '../components/inventory/DisposeModal';
import { useApp } from '../contexts/AppContext';
import { formatDate, formatQty, formatVnd } from '../utils/format';
import { batchState, countdownLabel, daysLeft } from '../utils/inventory';
import type { Batch, BatchState } from '../types';

const GROUPS: {state: BatchState;label: string;tone: string;}[] = [
{ state: 'FRESH', label: '🟢 Còn hạn', tone: 'text-emerald-600' },
{ state: 'NEAR_EXPIRY', label: '🟡 Sắp hết hạn', tone: 'text-amber-600' },
{ state: 'EXPIRED', label: '🔴 Đã hết hạn', tone: 'text-red-600' },
{ state: 'CANCELLED', label: '⚫ Đã hủy', tone: 'text-slate-500' }];


export function Expiry() {
  const { batches, ingredientOf, suppliers } = useApp();
  const [tab, setTab] = useState<BatchState>('NEAR_EXPIRY');
  const [ingFilter, setIngFilter] = useState('all');
  const [supFilter, setSupFilter] = useState('all');
  const [within, setWithin] = useState('all');
  const [disposing, setDisposing] = useState<Batch | null>(null);

  const counts = GROUPS.map(
    (g) => batches.filter((b) => batchState(b) === g.state).length
  );

  const rows = batches.
  filter((b) => batchState(b) === tab).
  filter((b) => ingFilter === 'all' || b.ingredientId === ingFilter).
  filter((b) => supFilter === 'all' || b.supplierId === supFilter).
  filter((b) => {
    if (within === 'all') return true;
    const d = daysLeft(b.expiryDate);
    return d <= Number(within);
  }).
  sort((a, b) => +new Date(a.expiryDate) - +new Date(b.expiryDate));

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Theo dõi hạn sử dụng"
        subtitle="Hệ thống kiểm tra hạn sử dụng hằng ngày — còn ≤ 2 ngày sẽ chuyển sang trạng thái SẮP HẾT HẠN" />
      

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {GROUPS.map((g, i) =>
        <button
          key={g.state}
          onClick={() => setTab(g.state)}
          className={`rounded-xl border bg-white px-4 py-3.5 text-left shadow-card transition-colors duration-150 ease-out ${
          tab === g.state ?
          'border-slate-900 ring-1 ring-slate-900' :
          'border-slate-200 hover:border-slate-300'}`
          }>
          
            <p className="text-xs text-slate-500">{g.label}</p>
            <p className={`tabular mt-1 text-2xl font-semibold ${g.tone}`}>
              {counts[i]}
            </p>
            <p className="text-xs text-slate-400">lô hàng</p>
          </button>
        )}
      </div>

      <Card>
        <CardHeader
          title={GROUPS.find((g) => g.state === tab)?.label ?? ''}
          subtitle={`${rows.length} lô`} />
        
        <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-5 py-4 sm:grid-cols-3">
          <Field label="Nguyên liệu">
            <select
              value={ingFilter}
              onChange={(e) => setIngFilter(e.target.value)}
              className={inputClass}>
              
              <option value="all">Tất cả nguyên liệu</option>
              {[...new Set(batches.map((b) => b.ingredientId))].map((id) =>
              <option key={id} value={id}>
                  {ingredientOf(id).name}
                </option>
              )}
            </select>
          </Field>
          <Field label="Nhà cung cấp">
            <select
              value={supFilter}
              onChange={(e) => setSupFilter(e.target.value)}
              className={inputClass}>
              
              <option value="all">Tất cả nhà cung cấp</option>
              {suppliers.map((s) =>
              <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              )}
            </select>
          </Field>
          <Field label="Khoảng thời gian">
            <select
              value={within}
              onChange={(e) => setWithin(e.target.value)}
              className={inputClass}>
              
              <option value="all">Không giới hạn</option>
              <option value="1">Hết hạn trong 1 ngày</option>
              <option value="2">Hết hạn trong 2 ngày</option>
              <option value="7">Hết hạn trong 7 ngày</option>
              <option value="30">Hết hạn trong 30 ngày</option>
            </select>
          </Field>
        </div>

        <ul className="divide-y divide-slate-100">
          {rows.map((b) => {
            const ing = ingredientOf(b.ingredientId);
            const left = daysLeft(b.expiryDate);
            return (
              <li
                key={b.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4">
                
                <div className="min-w-[220px] flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {ing.name}
                  </p>
                  <p className="tabular text-xs text-slate-500">
                    {b.id} · {suppliers.find((s) => s.id === b.supplierId)?.name}
                  </p>
                </div>
                <div className="tabular w-28 text-sm text-slate-700">
                  {formatQty(b.quantity, ing.unit)}
                </div>
                <div className="tabular w-32 text-sm text-slate-500">
                  HSD {formatDate(b.expiryDate)}
                </div>
                <div className="w-36">
                  {b.cancelled ?
                  <StateBadge state="CANCELLED" /> :

                  <Badge
                    tone={left < 0 ? 'red' : left <= 1 ? 'red' : left <= 2 ? 'amber' : 'green'}>
                    
                      {countdownLabel(b.expiryDate)}
                    </Badge>
                  }
                </div>
                <div className="tabular w-32 text-right text-sm text-slate-700">
                  {formatVnd(b.quantity * b.unitCost)}
                </div>
                <div className="flex gap-2">
                  {tab === 'NEAR_EXPIRY' &&
                  <Link to="/specials">
                      <Button size="sm" variant="warning">
                        <FlameIcon className="h-3.5 w-3.5" />
                        TẠO MÓN ĐẶC BIỆT
                      </Button>
                    </Link>
                  }
                  {(tab === 'EXPIRED' || tab === 'FRESH') &&
                  <Button
                    size="sm"
                    variant={tab === 'EXPIRED' ? 'danger' : 'secondary'}
                    onClick={() => setDisposing(b)}>
                    
                      <Trash2Icon className="h-3.5 w-3.5" />
                      XỬ LÝ HỦY
                    </Button>
                  }
                </div>
              </li>);

          })}
          {rows.length === 0 &&
          <li className="px-5 py-12 text-center text-sm text-slate-500">
              Không có lô nào trong nhóm này.
            </li>
          }
        </ul>
      </Card>

      <DisposeModal batch={disposing} onClose={() => setDisposing(null)} />
    </div>);

}
