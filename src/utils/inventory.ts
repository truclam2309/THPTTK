import type { Batch, BatchState, Dish, Ingredient } from '../types';

export const NEAR_EXPIRY_DAYS = 2;

export function startOfDay(d: Date | string): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysLeft(expiryDate: string, now: Date = new Date()): number {
  const a = startOfDay(expiryDate).getTime();
  const b = startOfDay(now).getTime();
  return Math.round((a - b) / 86_400_000);
}

export function batchState(batch: Batch, now: Date = new Date()): BatchState {
  if (batch.cancelled) return 'CANCELLED';
  const left = daysLeft(batch.expiryDate, now);
  if (left < 0) return 'EXPIRED';
  if (left <= NEAR_EXPIRY_DAYS) return 'NEAR_EXPIRY';
  return 'FRESH';
}

export const STATE_LABEL: Record<BatchState, string> = {
  FRESH: 'Còn hạn',
  NEAR_EXPIRY: 'Sắp hết hạn',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy'
};

export function countdownLabel(expiryDate: string, now: Date = new Date()) {
  const left = daysLeft(expiryDate, now);
  if (left < 0) return `Quá hạn ${Math.abs(left)} ngày`;
  if (left === 0) return 'Hết hạn hôm nay';
  return `Còn ${left} ngày`;
}

/** Số lượng khả dụng (còn hạn, chưa hủy) của một nguyên liệu */
export function availableQty(
batches: Batch[],
ingredientId: string,
now: Date = new Date())
: number {
  return batches.
  filter(
    (b) =>
    b.ingredientId === ingredientId &&
    !b.cancelled &&
    daysLeft(b.expiryDate, now) >= 0
  ).
  reduce((sum, b) => sum + b.quantity, 0);
}

/** Danh sách lô khả dụng, sắp xếp theo FEFO */
export function fefoBatches(
batches: Batch[],
ingredientId: string,
now: Date = new Date())
: Batch[] {
  return batches.
  filter(
    (b) =>
    b.ingredientId === ingredientId &&
    !b.cancelled &&
    b.quantity > 0 &&
    daysLeft(b.expiryDate, now) >= 0
  ).
  sort((a, b) => +new Date(a.expiryDate) - +new Date(b.expiryDate));
}

/** Số phần món có thể chế biến với tồn kho hiện tại */
export function servingsAvailable(
dish: Dish,
batches: Batch[],
now: Date = new Date())
: number {
  if (!dish.recipe.length) return 99;
  return Math.floor(
    Math.min(
      ...dish.recipe.map((r) =>
      r.qty > 0 ? availableQty(batches, r.ingredientId, now) / r.qty : 99
      )
    )
  );
}

export function ingredientById(list: Ingredient[], id: string) {
  return list.find((i) => i.id === id);
}

export function isLowStock(
ing: Ingredient,
batches: Batch[],
now: Date = new Date())
{
  return availableQty(batches, ing.id, now) < ing.minStock;
}