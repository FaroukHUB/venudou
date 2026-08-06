import type { ReactNode } from 'react';
import { metaForPath, type PageMeta } from './seo';
import { Breadcrumbs, SiteFooter, SiteHeader } from './components';

/**
 * Enveloppe commune des pages publiques : header, fil d'Ariane, main, footer.
 * Un seul <h1> par page (fourni par la page elle-même).
 */
export function PageShell({ path, children }: { path: string; children: ReactNode }) {
  const meta: PageMeta | undefined = metaForPath(path);
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader currentPath={path} />
      {meta && <Breadcrumbs meta={meta} />}
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-gradient-to-b from-navy-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-600">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}
