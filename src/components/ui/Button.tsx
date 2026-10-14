import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
  'bg-brand-600 text-white shadow-sm hover:-translate-y-px hover:bg-brand-700 hover:shadow-md focus-visible:outline-brand-600',
  secondary:
  'bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 focus-visible:outline-slate-500',
  ghost:
  'text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400',
  danger:
  'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  warning:
  'bg-amber-500 text-white hover:bg-amber-600 focus-visible:outline-amber-500'
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2'
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}>
      
      {children}
    </button>);

}
