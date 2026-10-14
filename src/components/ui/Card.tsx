import React from 'react';

export function Card({
  children,
  className = ''



}: {children: React.ReactNode;className?: string;}) {
  return (
    <div
      className={`surface-card rounded-2xl border border-slate-200/80 bg-white shadow-card ${className}`}>
      
      {children}
    </div>);

}

export function CardHeader({
  title,
  subtitle,
  action




}: {title: string;subtitle?: string;action?: React.ReactNode;}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-sm font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle &&
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        }
      </div>
      {action}
    </div>);

}

export function PageHeader({
  title,
  subtitle,
  action




}: {title: string;subtitle?: string;action?: React.ReactNode;}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.8rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>);

}
