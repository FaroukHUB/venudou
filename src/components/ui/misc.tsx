import type { ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-navy-400" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Badge({
  children,
  tone = 'navy',
}: {
  children: ReactNode;
  tone?: 'navy' | 'turquoise' | 'violet' | 'green' | 'red' | 'gray';
}) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700',
    turquoise: 'bg-turquoise-50 text-turquoise-700',
    violet: 'bg-violet-50 text-violet-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    gray: 'bg-surface-strong text-navy-500',
  } as const;
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-navy-200 bg-white px-6 py-12 text-center">
      <Inbox className="size-8 text-navy-300" aria-hidden />
      <p className="font-semibold text-navy-800">{title}</p>
      {description && <p className="max-w-md text-sm text-navy-500">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
      role="alert"
    >
      <AlertTriangle className="size-8 text-red-500" aria-hidden />
      <p className="font-semibold text-red-800">Une erreur est survenue</p>
      <p className="max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-navy-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-turquoise-500' : 'bg-navy-200',
      )}
    >
      <span
        className={clsx(
          'inline-block size-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = 'navy',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: 'navy' | 'turquoise' | 'violet';
}) {
  const accents = {
    navy: 'text-navy-800',
    turquoise: 'text-turquoise-600',
    violet: 'text-violet-600',
  } as const;
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-navy-400 uppercase">{label}</p>
      <p className={clsx('mt-1 text-3xl font-bold tabular-nums', accents[accent])}>{value}</p>
      {sub && <p className="mt-1 text-xs text-navy-400">{sub}</p>}
    </div>
  );
}
