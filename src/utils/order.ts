import type { LineStatus, Order, OrderLine } from '../types';

export const VAT_RATE = 0.08;

export function orderTotals(lines: OrderLine[], discountRate = 0) {
  const subtotal = lines.reduce((s, l) => s + l.price * billableQty(l), 0);
  const discount = Math.round(subtotal * discountRate / 100);
  const vat = Math.round((subtotal - discount) * VAT_RATE);
  return { subtotal, discount, vat, total: subtotal - discount + vat };
}

/** Các dòng đã gửi (không tính bản nháp của phục vụ) */
export function submittedLines(order: Order) {
  return order.lines.filter((l) => l.status !== 'DRAFT');
}

export function billableQty(line: OrderLine) {
  if (line.status === 'CANCELLED') return 0;
  return Math.max(0, line.qty - (line.cancelledQty ?? 0));
}

export function isReadyToPay(order: Order) {
  const lines = submittedLines(order).filter((l) => billableQty(l) > 0);
  return lines.length > 0 && lines.every((l) => l.status === 'READY');
}

export const LINE_LABEL: Record<LineStatus, string> = {
  DRAFT: 'Chưa gửi',
  PENDING: 'Chờ bếp',
  COOKING: 'Đang chế biến',
  CASHIER_PENDING: 'Chờ thu ngân xác nhận',
  READY: 'Sẵn sàng phục vụ',
  CANCELLED: 'Đã hủy'
};

export const LINE_TONE: Record<LineStatus, 'slate' | 'amber' | 'blue' | 'green'> = {
  DRAFT: 'slate',
  PENDING: 'amber',
  COOKING: 'blue',
  CASHIER_PENDING: 'amber',
  READY: 'green',
  CANCELLED: 'slate'
};

export function minutesSince(iso?: string) {
  if (!iso) return 0;
  return Math.max(0, Math.round((Date.now() - +new Date(iso)) / 60000));
}
