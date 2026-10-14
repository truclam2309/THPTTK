import React from 'react';
import type { BatchState } from '../../types';
import { STATE_LABEL } from '../../utils/inventory';

export type Tone =
'green' |
'amber' |
'red' |
'orange' |
'slate' |
'blue' |
'violet';

const TONES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  blue: 'bg-brand-50 text-brand-700 ring-brand-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200'
};

export function Badge({
  tone = 'slate',
  children,
  dot = false,
  className = ''





}: {tone?: Tone;children: React.ReactNode;dot?: boolean;className?: string;}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}>
      
      {dot &&
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      }
      {children}
    </span>);

}

export const STATE_TONE: Record<BatchState, Tone> = {
  FRESH: 'green',
  NEAR_EXPIRY: 'amber',
  EXPIRED: 'red',
  CANCELLED: 'slate'
};

export function StateBadge({ state }: {state: BatchState;}) {
  return (
    <Badge tone={STATE_TONE[state]} dot>
      {STATE_LABEL[state]}
    </Badge>);

}