import { MapPinIcon, PhoneIcon } from 'lucide-react';
import { Card, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';
import { formatVnd } from '../utils/format';
import { batchState } from '../utils/inventory';

export function Suppliers() {
  const { suppliers, batches, ingredientOf } = useApp();

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Nhà cung cấp"
        subtitle="Giá trị nhập và chất lượng lô hàng theo từng nhà cung cấp" />
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {suppliers.map((s) => {
          const lots = batches.filter((b) => b.supplierId === s.id);
          const value = lots.reduce(
            (sum, b) => sum + b.initialQuantity * b.unitCost,
            0
          );
          const wasted = lots.filter(
            (b) => b.cancelled || batchState(b) === 'EXPIRED'
          );
          const items = [
          ...new Set(lots.map((b) => ingredientOf(b.ingredientId).name))];

          return (
            <Card key={s.id} className="flex h-full flex-col p-5">
              <p className="text-sm font-semibold text-slate-900">{s.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <PhoneIcon className="h-3.5 w-3.5" />
                {s.phone}
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
                <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {s.address}
              </p>
              <dl className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Số lô đã nhập</dt>
                  <dd className="tabular font-medium">{lots.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Giá trị nhập</dt>
                  <dd className="tabular font-medium">{formatVnd(value)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Lô hỏng / hết hạn</dt>
                  <dd className="tabular font-medium text-red-600">
                    {wasted.length}
                  </dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                {items.slice(0, 3).map((i) =>
                <Badge key={i} tone="slate">
                    {i}
                  </Badge>
                )}
              </div>
            </Card>);

        })}
      </div>
    </div>);

}
