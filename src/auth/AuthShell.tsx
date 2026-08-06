import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo } from '@/components/ui/Logo';

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 py-10">
      <Link to="/" className="mb-8" aria-label="Retour à l'accueil VenuD'où">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-navy-100 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-navy-900">{title}</h1>
        {children}
      </div>
      {footer && <div className="mt-6 text-sm text-navy-500">{footer}</div>}
    </main>
  );
}
