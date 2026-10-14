import React from 'react';

export function Field({
  label,
  hint,
  children,
  className = ''





}: {label: string;hint?: string;children: React.ReactNode;className?: string;}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>);

}

export const inputClass =
'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 ease-out focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';