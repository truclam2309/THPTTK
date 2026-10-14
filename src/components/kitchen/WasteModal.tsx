import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';
import { useApp } from '../../contexts/AppContext';
import { formatQty, formatVnd } from '../../utils/format';
import { availableQty } from '../../utils/inventory';
import type { Dish } from '../../types';

const REASONS = ['Hao hụt sơ chế', 'Nấu hỏng / làm lại', 'Rơi vỡ', 'Khác'];

export function WasteModal({
  open,
  dish,
  onClose




}: {open: boolean;dish?: Dish | null;onClose: () => void;}) {
  const { ingredients, batches, recordWaste, ingredientOf } = useApp();
  const options = dish ?
  dish.recipe.map((r) => ingredientOf(r.ingredientId)) :
  ingredients;
  const [ingredientId, setIngredientId] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setIngredientId(options[0]?.id ?? '');
    setQty('');
    setReason(REASONS[0]);
    setNote('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dish?.id]);

  const ing = ingredientId ? ingredientOf(ingredientId) : null;
  const avail = ing ? availableQty(batches, ing.id) : 0;
  const amount = Number(qty) || 0;
  const valid = !!ing && amount > 0 && amount <= avail;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ghi nhận hao hụt"
      description={
      dish ?
      `Nguyên liệu hao hụt khi chế biến ${dish.name}` :
      'Trừ khỏi tồn kho theo lô hết hạn trước (FEFO)'
      }
      width="max-w-md"
      footer={
      <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
          variant="warning"
          disabled={!valid}
          onClick={() => {
            if (!ing) return;
            recordWaste(ing.id, amount, note ? `${reason} — ${note}` : reason);
            onClose();
          }}>
          
            Ghi nhận hao hụt
          </Button>
        </>
      }>
      
      <div className="space-y-4">
        <Field label="Nguyên liệu">
          <select
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            className={inputClass}>
            
            {options.map((i) =>
            <option key={i.id} value={i.id}>
                {i.name} ({i.unit})
              </option>
            )}
          </select>
        </Field>
        <Field
          label={`Số lượng hao hụt (${ing?.unit ?? ''})`}
          hint={ing ? `Tồn khả dụng: ${formatQty(avail, ing.unit)}` : undefined}>
          
          <input
            type="number"
            min={0}
            step="0.01"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder={ing?.unit === 'kg' ? 'vd: 0.2 (= 200 g)' : 'vd: 1'}
            className={inputClass} />
          
        </Field>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">Lý do</p>
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) =>
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ease-out ${
              reason === r ?
              'border-amber-500 bg-amber-50 font-medium text-amber-800' :
              'border-slate-300 text-slate-600 hover:bg-slate-50'}`
              }>
              
                {r}
              </button>
            )}
          </div>
        </div>
        <Field label="Ghi chú">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Chi tiết (không bắt buộc)"
            className={inputClass} />
          
        </Field>
        {ing && amount > 0 &&
        <p className="tabular rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Giá trị ước tính:{' '}
            <strong className="text-red-600">{formatVnd(amount * ing.refCost)}</strong>
            {amount > avail &&
          <span className="ml-2 text-red-600">— vượt tồn khả dụng</span>
          }
          </p>
        }
      </div>
    </Modal>);

}
