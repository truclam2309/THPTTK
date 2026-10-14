import type { Batch, Ingredient, StockTx, TxType } from '../types';
import { fefoBatches } from './inventory';

export interface Need {
  ingredientId: string;
  qty: number;
  reason: string;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Trừ kho theo FEFO — lô hết hạn trước được dùng trước.
 * Trả về danh sách lô mới, giao dịch phát sinh, tổng giá vốn và nguyên liệu thiếu.
 */
export function deductFefo(
batches: Batch[],
needs: Need[],
opts: {
  type: TxType;
  user: string;
  ingredients: Ingredient[];
  makeId: () => string;
})
{
  const working = batches.map((b) => ({ ...b }));
  const txs: StockTx[] = [];
  const shortages: string[] = [];
  let cost = 0;
  const now = new Date().toISOString();

  needs.forEach((n) => {
    let need = n.qty;
    const unit =
    opts.ingredients.find((i) => i.id === n.ingredientId)?.unit ?? 'kg';
    fefoBatches(working, n.ingredientId).forEach((b) => {
      if (need <= 0.0001) return;
      const take = Math.min(b.quantity, need);
      b.quantity = round3(b.quantity - take);
      need = round3(need - take);
      const value = take * b.unitCost;
      cost += value;
      txs.push({
        id: opts.makeId(),
        at: now,
        type: opts.type,
        batchId: b.id,
        ingredientId: n.ingredientId,
        qty: round3(take),
        unit,
        user: opts.user,
        reason: n.reason,
        value
      });
    });
    if (need > 0.0001) shortages.push(n.ingredientId);
  });

  return { batches: working, txs, cost: Math.round(cost), shortages };
}