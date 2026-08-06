import type { ReactNode } from 'react';
import {
  Check,
  EyeOff,
  Facebook,
  Instagram,
  MessagesSquare,
  MoreHorizontal,
  Music2,
  Search,
  User,
  type LucideIcon,
} from 'lucide-react';
import { SITE, type PageMeta } from './seo';
import type { FaqItem } from './content/faq';

/**
 * Composants du site public. Rendus statiquement au build (aucun état React
 * nécessaire) et montés tels quels dans la SPA en développement.
 * Liens en <a> natif : côté statique il n'y a pas de routeur.
 */

export function SiteHeader({ currentPath }: { currentPath: string }) {
  const links = [
    { href: '/fonctionnalites', label: 'Fonctionnalités' },
    { href: '/tarifs', label: 'Tarifs' },
    { href: '/restaurants', label: 'Restaurants' },
    { href: '/magasins', label: 'Magasins' },
    { href: '/multi-etablissements', label: 'Multi-établissements' },
    { href: '/faq', label: 'FAQ' },
  ];
  return (
    <header className="border-b border-navy-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="/" aria-label="VenuD'où — accueil">
          <img
            src="/brand/logo-full.svg"
            alt="VenuD'où"
            width={165}
            height={36}
            className="h-9 w-auto"
          />
        </a>
        {/* Navigation sans JavaScript : details/summary sur mobile */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-5 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={currentPath === l.href ? 'page' : undefined}
              className={`text-sm font-medium hover:text-turquoise-600 ${
                currentPath === l.href ? 'text-turquoise-600' : 'text-navy-700'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="/connexion"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50 sm:block"
          >
            Connexion
          </a>
          <a
            href="/inscription"
            className="rounded-xl bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
          >
            Essayer VenuD'où
          </a>
        </div>
      </div>
      <details className="border-t border-navy-50 md:hidden">
        <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-navy-700">
          Menu
        </summary>
        <nav aria-label="Navigation mobile" className="flex flex-col gap-1 px-4 pb-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-2 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/connexion"
            className="rounded-lg px-2 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
          >
            Connexion
          </a>
        </nav>
      </details>
    </header>
  );
}

export function SiteFooter() {
  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: 'Produit',
      links: [
        { href: '/fonctionnalites', label: 'Fonctionnalités' },
        { href: '/tablette-client', label: 'Questionnaire sur tablette' },
        { href: '/provenance-client', label: 'Provenance client' },
        { href: '/avis-google', label: 'Avis Google' },
        { href: '/instant-gagnant', label: 'Instant gagnant' },
        { href: '/tarifs', label: 'Tarifs' },
      ],
    },
    {
      title: 'Secteurs',
      links: [
        { href: '/restaurants', label: 'Restaurants' },
        { href: '/magasins', label: 'Magasins et commerces' },
        { href: '/multi-etablissements', label: 'Réseaux multi-établissements' },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { href: '/guides', label: 'Guides' },
        { href: '/blog', label: 'Blog' },
        { href: '/cas-clients', label: 'Cas clients' },
        { href: '/faq', label: 'FAQ' },
      ],
    },
  ];
  return (
    <footer className="border-t border-navy-100 bg-navy-900 text-navy-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img
            src="/brand/logo-full.svg"
            alt="VenuD'où"
            width={165}
            height={36}
            className="h-9 w-auto brightness-0 invert"
          />
          <p className="mt-3 text-sm">{SITE.tagline}</p>
          <p className="mt-2 text-xs text-navy-300">
            Logiciel SaaS de connaissance client et d'attribution des visites physiques, pour les
            restaurants, magasins, commerces et réseaux multi-établissements.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mb-3 text-sm font-bold text-white">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm hover:text-turquoise-300">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-navy-300">
        © {new Date().getFullYear()} VenuD'où — Tous droits réservés
      </div>
    </footer>
  );
}

export function Breadcrumbs({ meta }: { meta: PageMeta }) {
  const crumbs = meta.breadcrumb;
  if (!crumbs || crumbs.length === 0) return null;
  // Chemins intermédiaires déduits des segments de l'URL de la page.
  const segments = meta.path.split('/').filter(Boolean);
  return (
    <nav aria-label="Fil d'Ariane" className="mx-auto max-w-6xl px-4 pt-4 text-xs text-navy-400">
      <ol className="flex flex-wrap gap-1">
        <li>
          <a href="/" className="hover:text-turquoise-600 hover:underline">
            Accueil
          </a>
          <span aria-hidden> / </span>
        </li>
        {crumbs.map((label, i) => (
          <li key={i} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
            {i === crumbs.length - 1 ? (
              <span className="text-navy-600">{label}</span>
            ) : (
              <>
                <a href={`/${segments.slice(0, i + 1).join('/')}`} className="hover:underline">
                  {label}
                </a>
                <span aria-hidden> / </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Section({
  title,
  intro,
  children,
  muted = false,
  id,
}: {
  title?: string;
  intro?: string;
  children: ReactNode;
  muted?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={muted ? 'bg-surface-muted' : 'bg-white'}>
      <div className="mx-auto max-w-6xl px-4 py-14">
        {title && <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">{title}</h2>}
        {intro && <p className="mt-3 max-w-3xl text-navy-600">{intro}</p>}
        <div className={title ? 'mt-8' : ''}>{children}</div>
      </div>
    </section>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  children,
  href,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  href?: string;
}) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-6">
      <span className="inline-flex rounded-xl bg-turquoise-50 p-2.5 text-turquoise-600">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-3 text-lg font-bold text-navy-900">{title}</h3>
      <p className="mt-2 text-sm text-navy-600">{children}</p>
      {href && (
        <a
          href={href}
          className="mt-3 inline-block text-sm font-semibold text-turquoise-600 hover:underline"
        >
          En savoir plus →
        </a>
      )}
    </div>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-navy-700">
          <Check className="mt-0.5 size-5 shrink-0 text-turquoise-500" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-4">
          <summary className="cursor-pointer text-base font-semibold text-navy-800 group-open:text-turquoise-700">
            {item.question}
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-navy-600">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBanner({
  title = 'Prêt à comprendre d’où viennent vos clients ?',
  subtitle = 'Créez votre compte, installez la tablette et collectez vos premières réponses aujourd’hui.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="bg-navy-900">
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-navy-100">{subtitle}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href="/inscription"
            className="rounded-xl bg-turquoise-500 px-6 py-3 font-semibold text-white hover:bg-turquoise-600"
          >
            Créer mon compte
          </a>
          <a
            href="/tarifs"
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Voir les tarifs
          </a>
        </div>
      </div>
    </section>
  );
}

/** Démo statique du parcours tablette (contenu principal dans le HTML). */
export function KioskDemo() {
  const steps: {
    step: string;
    question: string;
    options: { label: string; icon?: LucideIcon; highlight?: boolean }[];
    hint: string;
  }[] = [
    {
      step: '1/3',
      question: 'Comment avez-vous connu notre établissement ?',
      options: [
        { label: 'Facebook', icon: Facebook },
        { label: 'Instagram', icon: Instagram, highlight: true },
        { label: 'TikTok', icon: Music2 },
        { label: 'Google', icon: Search },
        { label: 'Bouche-à-oreille', icon: MessagesSquare },
        { label: 'Autre', icon: MoreHorizontal },
      ],
      hint: 'Un appui suffit — étape suivante automatique',
    },
    {
      step: '2/3',
      question: 'Vous êtes…',
      options: [
        { label: 'Homme', icon: User },
        { label: 'Femme', icon: User, highlight: true },
        { label: 'Je préfère ne pas répondre', icon: EyeOff },
      ],
      hint: 'Question facultative — passable en un geste',
    },
    {
      step: '3/3',
      question: 'Quel âge avez-vous ?',
      options: [
        { label: '18–24 ans' },
        { label: '25–34 ans', highlight: true },
        { label: '35–44 ans' },
        { label: '45–54 ans' },
      ],
      hint: 'Tranches entièrement personnalisables',
    },
  ];
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {steps.map((s, stepIndex) => (
        <div
          key={s.step}
          className={`lift rounded-3xl bg-navy-900 p-5 text-white shadow-lg ${
            stepIndex === 1 ? 'md:translate-y-3' : ''
          }`}
        >
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full ${
                  i <= stepIndex ? 'w-6 bg-turquoise-400' : 'w-3 bg-white/15'
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-bold text-turquoise-300">{s.step}</span>
          </div>
          <p className="min-h-12 text-center text-base font-bold">{s.question}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {s.options.map(({ label, icon: Icon, highlight }) => (
              <span
                key={label}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-colors ${
                  highlight
                    ? 'bg-turquoise-500 text-white shadow-md shadow-turquoise-500/30'
                    : 'bg-white/10 hover:bg-white/20'
                } ${label.length > 16 ? 'col-span-2' : ''}`}
              >
                {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
                {label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-center text-[10px] text-navy-300">{s.hint}</p>
        </div>
      ))}
    </div>
  );
}
