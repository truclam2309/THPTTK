import type { Unit } from '../types';

const vnd = new Intl.NumberFormat('vi-VN');

export function formatVnd(value: number): string {
  return `${vnd.format(Math.round(value))} ₫`;
}

export function formatShortVnd(value: number): string {
  if (Math.abs(value) >= 1_000_000)
  return `${(value / 1_000_000).toFixed(1).replace('.0', '')}tr`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}k`;
  return vnd.format(Math.round(value));
}

export function formatQty(qty: number, unit: Unit): string {
  if (unit === 'kg' && qty > 0 && qty < 1) {
    return `${Math.round(qty * 1000)} g`;
  }
  const rounded = Math.round(qty * 1000) / 1000;
  return `${vnd.format(rounded)} ${unit}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(iso: string): string {
  return `${formatTime(iso)} · ${formatDate(iso)}`;
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}