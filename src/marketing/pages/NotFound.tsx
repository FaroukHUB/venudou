import { SiteFooter, SiteHeader } from '../components';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader currentPath="/404" />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-6xl font-bold text-turquoise-500">404</p>
        <h1 className="mt-4 text-2xl font-bold text-navy-900">Cette page n'existe pas</h1>
        <p className="mt-3 text-navy-600">
          L'adresse demandée est introuvable. Elle a peut-être été déplacée ou supprimée.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a
            href="/"
            className="rounded-xl bg-navy-800 px-5 py-2.5 font-semibold text-white hover:bg-navy-700"
          >
            Retour à l'accueil
          </a>
          <a
            href="/fonctionnalites"
            className="rounded-xl border border-navy-200 px-5 py-2.5 font-semibold text-navy-800 hover:bg-navy-50"
          >
            Voir les fonctionnalités
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
