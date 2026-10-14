import { useState } from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';
import { useApp } from '../../contexts/AppContext';
import { formatQty, formatVnd } from '../../utils/format';
import type { Batch } from '../../types';

const REASONS = ['Hết hạn', 'Hư hỏng', 'Không đạt chất lượng', 'Khác'];

export function DisposeModal({
  batch,
  onClose



}: {batch: Batch | null;onClose: () => void;}) {
  const { ingredientOf, disposeBatch } = useApp();
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');

  const ing = batch ? ingredientOf(batch.ingredientId) : null;

  return (
    <Modal
      open={!!batch}
      onClose={onClose}
      title="Xác nhận hủy hàng"
      description="Lô hàng sẽ chuyển sang trạng thái ĐÃ HỦY và bị loại khỏi tồn kho khả dụng."
      footer={
      <>
          <Button variant="secondary" onClick={onClose}>
            Quay lại
          </Button>
          <Button
          variant="danger"
          onClick={() => {
            if (batch) disposeBatch(batch.id, reason, note);
            setNote('');
            setReason(REASONS[0]);
            onClose();
          }}>
          
            XÁC NHẬN HỦY
          </Button>
        </>
      }>
      
      {batch && ing &&
      <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50 p-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Nguyên liệu</dt>
              <dd className="font-medium text-slate-900">{ing.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Mã lô</dt>
              <dd className="font-medium text-slate-900">{batch.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Số lượng</dt>
              <dd className="tabular font-medium text-slate-900">
                {formatQty(batch.quantity, ing.unit)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Giá trị hao hụt</dt>
              <dd className="tabular font-medium text-red-600">
                {formatVnd(batch.quantity * batch.unitCost)}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-slate-600">Lý do hủy</p>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) =>
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ease-out ${
              reason === r ?
              'border-red-500 bg-red-50 font-medium text-red-700' :
              'border-slate-300 text-slate-600 hover:bg-slate-50'}`
              }>
              
                  {r}
                </button>
            )}
            </div>
          </div>

          <Field label="Ghi chú" className="mt-4">
            <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mô tả tình trạng hàng hóa, người chứng kiến…"
            className={inputClass} />
          
          </Field>

          <div className="mt-4 flex gap-2.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangleIcon className="h-4 w-4 shrink-0" />
            <p>
              Dữ liệu lô không bị xóa khỏi hệ thống (soft delete). Lô vẫn truy
              xuất được trong Lịch sử hủy hàng và được ghi nhận vào chi phí hao
              hụt.
            </p>
          </div>
        </>
      }
    </Modal>);

}
