import type * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ClassNameProp = { className?: string };

export function AppLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return <Link className={cn('text-slate-100 underline decoration-slate-400/40 underline-offset-4 transition hover:text-white', className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-white/10 bg-white/6 p-6 shadow-glow backdrop-blur', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold tracking-tight text-white', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-slate-300', className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-2 block text-sm font-medium text-slate-200', className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20', className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20', className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20', className)} {...props} />;
}

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('inline-flex items-center justify-center rounded-xl bg-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60', className)} {...props} />;
}

export function GhostButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10', className)} {...props} />;
}

export function Badge({ tone = 'neutral', className, children }: React.PropsWithChildren<{ tone?: 'neutral' | 'success' | 'danger' | 'warning' } & ClassNameProp>) {
  const toneClass = {
    neutral: 'bg-white/10 text-slate-200 ring-white/10',
    success: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/20',
    danger: 'bg-rose-400/15 text-rose-300 ring-rose-400/20',
    warning: 'bg-amber-400/15 text-amber-200 ring-amber-400/20',
  }[tone];

  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1', toneClass, className)}>{children}</span>;
}

export function Notice({ tone = 'info', className, children }: React.PropsWithChildren<{ tone?: 'info' | 'success' | 'danger' | 'warning' } & ClassNameProp>) {
  const toneClass = {
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
    warning: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  }[tone];

  return <div className={cn('rounded-2xl border px-4 py-3 text-sm', toneClass, className)}>{children}</div>;
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
    </Card>
  );
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 text-sm text-slate-200', className)} {...props} />;
}

export function TableHeadCell({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('border-b border-white/10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400', className)} {...props} />;
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-white/5 px-4 py-3 align-top', className)} {...props} />;
}