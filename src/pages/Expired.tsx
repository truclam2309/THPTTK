import { useState } from 'react';
import { AlertTriangleIcon, BanIcon, Trash2Icon } from 'lucide-react';
import { Card, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DisposeModal } from '../components/inventory/DisposeModal';
import { useApp } from '../contexts/AppContext';
import { formatDate, formatQty, formatVnd } from '../utils/format';
import { batchState, countdownLabel } from '../utils/inventory';
import type { Batch } from '../types';

export function Expired() {
  const { batches, ingredientOf, suppliers } = useApp();
  const [disposing, setDisposing] = useState<Batch | null>(null);

  const expired = batches.filter((b) => batchState(b) === 'EXPIRED');
  const totalValue = expired.reduce((s, b) => s + b.quantity * b.unitCost, 0);

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Hàng hết hạn"
        subtitle="Nguyên liệu quá hạn sử dụng — không được phép chế biến hoặc bán" />
      

      <Card className="mb-4 border-red-200 bg-red-50">
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <BanIcon className="h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-900">
            <span className="font-semibold">
              {expired.length} lô đã hết hạn
            </span>{' '}
            — tổng giá trị{' '}
            <span className="tabular font-semibold">
              {formatVnd(totalValue)}
            </span>
            . Các lô này đã bị loại khỏi tồn kho khả dụng cho Order và Bếp, cần
            xử lý hủy để ghi nhận chi phí hao hụt.
          </p>
        </div>
      </Card>

      {expired.length === 0 ?
      <Card className="flex flex-col items-center justify-center py-16">
          <AlertTriangleIcon className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Không có lô nào hết hạn
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Tất cả nguyên liệu trong kho đều còn hạn sử dụng.
          </p>
        </Card> :

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {expired.map((b) => {
          const ing = ingredientOf(b.ingredientId);
          return (
            <Card key={b.id} className="flex h-full flex-col border-red-200">
                <div className="flex items-start justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {ing.name}
                    </p>
                    <p className="tabular text-xs text-slate-500">{b.id}</p>
                  </div>
                  <Badge tone="red" dot>
                    Đã hết hạn
                  </Badge>
                </div>
                <dl className="space-y-2 px-5 pb-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Số lượng</dt>
                    <dd className="tabular font-medium">
                      {formatQty(b.quantity, ing.unit)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Hạn sử dụng</dt>
                    <dd className="tabular">{formatDate(b.expiryDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Quá hạn</dt>
                    <dd className="font-medium text-red-600">
                      {countdownLabel(b.expiryDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Nhà cung cấp</dt>
                    <dd className="text-slate-700">
                      {suppliers.find((s) => s.id === b.supplierId)?.name}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <dt className="text-slate-500">Giá trị hao hụt</dt>
                    <dd className="tabular font-semibold text-red-600">
                      {formatVnd(b.quantity * b.unitCost)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto border-t border-slate-200 px-5 py-3">
                  <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => setDisposing(b)}>
                  
                    <Trash2Icon className="h-4 w-4" />
                    XỬ LÝ HỦY
                  </Button>
                </div>
              </Card>);

        })}
        </div>
      }

      <DisposeModal batch={disposing} onClose={() => setDisposing(null)} />
    </div>);

}
