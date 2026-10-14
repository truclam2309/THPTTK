import React from 'react';
import { Link } from 'react-router-dom';

export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
  to,
  icon: Icon







}: {label: string;value: string;hint?: string;tone?: 'default' | 'amber' | 'red' | 'orange';to?: string;icon?: React.ComponentType<{className?: string;}>;}) {
  const tones = {
    default: 'text-slate-900',
    amber: 'text-amber-600',
    red: 'text-red-600',
    orange: 'text-orange-600'
  };

  const body =
  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-card transition-colors duration-150 ease-out">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="truncate">{label}</span>
      </div>
      <p className={`tabular mt-1.5 text-xl font-semibold ${tones[tone]}`}>
        {value}
      </p>
      {hint && <p className="mt-auto pt-1 text-xs text-slate-400">{hint}</p>}
    </div>;


  return to ?
  <Link to={to} className="block h-full hover:opacity-90">
      {body}
    </Link> :

  body;

}