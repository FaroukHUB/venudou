import { Gift, MessagesSquare, MoreHorizontal, Search, Star, TrendingUp } from 'lucide-react';
import { BRAND_ICONS } from '@/lib/brand-icons';

/**
 * Illustrations du site public — 100 % HTML/SVG/CSS, aux couleurs de la
 * charte. Aucune image téléchargée : rapide, net sur tous les écrans,
 * compatible avec le pré-rendu statique.
 */

/** Fond décoratif : halos flottants aux couleurs du logo. */
export function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-float-slow absolute -top-24 -left-24 size-96 rounded-full bg-turquoise-300/30 blur-3xl" />
      <div className="animate-float-slower absolute top-1/3 -right-32 size-[28rem] rounded-full bg-navy-300/25 blur-3xl" />
      <div className="animate-float absolute -bottom-24 left-1/3 size-80 rounded-full bg-violet-300/20 blur-3xl" />
    </div>
  );
}

/** Tablette du hero, inclinée en 3D, avec badges flottants. */
export function HeroTablet() {
  return (
    <div className="hero-scene relative mx-auto w-full max-w-md" aria-hidden>
      {/* Badges flottants */}
      <div className="animate-float absolute -top-6 -left-4 z-10 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 shadow-lg">
        <span className="rounded-lg bg-turquoise-50 p-1.5 text-turquoise-600">
          <TrendingUp className="size-4" />
        </span>
        <div>
          <p className="text-xs font-bold text-navy-900">Instagram</p>
          <p className="text-[10px] text-navy-400">provenance nº1 cette semaine</p>
        </div>
      </div>
      <div className="animate-float-slow absolute -right-6 top-16 z-10 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 shadow-lg">
        <span className="rounded-lg bg-violet-50 p-1.5 text-violet-600">
          <Gift className="size-4" />
        </span>
        <p className="text-xs font-bold text-navy-900">Instant gagnant 🎉</p>
      </div>
      <div className="animate-float-slower absolute -bottom-5 right-8 z-10 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 shadow-lg">
        <span className="rounded-lg bg-turquoise-50 p-1.5 text-turquoise-600">
          <Star className="size-4" />
        </span>
        <p className="text-xs font-bold text-navy-900">+1 scan avis Google</p>
      </div>

      {/* Tablette */}
      <div className="hero-tablet rounded-[2rem] bg-navy-950 p-3">
        <div className="rounded-[1.5rem] bg-navy-900 px-5 py-7">
          <p className="text-center text-xs font-bold text-turquoise-300">1/3</p>
          <p className="mt-2 text-center text-lg font-bold text-white">
            Comment avez-vous connu notre établissement ?
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {(
              [
                ['Facebook', BRAND_ICONS.facebook],
                ['Instagram', BRAND_ICONS.instagram],
                ['TikTok', BRAND_ICONS.tiktok],
                ['Google', BRAND_ICONS.google],
                ['Bouche-à-oreille', null],
                ['Autre', null],
              ] as const
            ).map(([label, Brand], i) => (
              <span
                key={label}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs font-semibold ${
                  i === 1 ? 'bg-turquoise-500 text-white' : 'bg-white/10 text-white'
                }`}
              >
                {Brand ? (
                  <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                    <Brand className="size-4" />
                  </span>
                ) : label === 'Autre' ? (
                  <MoreHorizontal className="size-4 shrink-0" aria-hidden />
                ) : (
                  <MessagesSquare className="size-4 shrink-0" aria-hidden />
                )}
                {label}
              </span>
            ))}
          </div>
          <p className="mt-4 text-center text-[10px] text-navy-300">
            Appuyez pour répondre — 15 secondes
          </p>
        </div>
      </div>
    </div>
  );
}

/** Maquette du tableau de bord : mini graphiques SVG aux couleurs charte. */
export function DashboardMockup() {
  const bars = [64, 40, 30, 22, 14, 8];
  const labels = ['Instagram', 'Bouche-à-or.', 'Google', 'Facebook', 'TikTok', 'Autre'];
  return (
    <div className="lift rounded-3xl border border-navy-100 bg-white p-5 shadow-xl" aria-hidden>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-navy-900">Répartition des provenances</p>
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-semibold text-navy-500">
          30 derniers jours
        </span>
      </div>
      <div className="space-y-2.5">
        {bars.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-[11px] text-navy-500">{labels[i]}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-turquoise-500"
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="w-8 text-right text-[11px] font-bold text-navy-800 tabular-nums">
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ['Réponses', '412'],
          ['Scans avis', '87'],
          ['Gains', '12'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-surface-muted px-3 py-2">
            <p className="text-[10px] font-semibold text-navy-400 uppercase">{label}</p>
            <p className="text-lg font-bold text-navy-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-navy-300">Données de démonstration</p>
    </div>
  );
}

/** Téléphone avec QR code — parcours avis Google. */
export function PhoneQrMockup() {
  // Motif QR décoratif (grille déterministe)
  const cells: boolean[] = Array.from(
    { length: 121 },
    (_, i) => ((i * 7) % 13 < 6 || i % 17 === 0) && i % 5 !== 2,
  );
  return (
    <div className="relative mx-auto w-56" aria-hidden>
      <div className="animate-float-slow absolute -top-4 -right-8 z-10 flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 shadow-lg">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className="size-3.5 fill-turquoise-500 text-turquoise-500" />
        ))}
      </div>
      <div className="lift rounded-[2rem] bg-navy-950 p-2.5 shadow-xl">
        <div className="rounded-[1.6rem] bg-white px-4 py-6 text-center">
          <p className="text-xs font-bold text-navy-900">Laisser un avis ?</p>
          <div className="mx-auto mt-3 grid w-32 grid-cols-11 gap-[2px] rounded-lg border border-navy-100 p-2">
            {cells.map((filled, i) => (
              <span
                key={i}
                className={`aspect-square rounded-[1px] ${filled ? 'bg-navy-900' : 'bg-transparent'}`}
              />
            ))}
          </div>
          <p className="mt-3 text-[10px] text-navy-400">
            Scannez pour ouvrir la page d'avis Google de l'établissement
          </p>
        </div>
      </div>
    </div>
  );
}

/** Carte de gain — instant gagnant. */
export function RewardMockup() {
  return (
    <div className="relative mx-auto w-72" aria-hidden>
      <div className="animate-float absolute -top-5 -left-6 z-10 rounded-2xl bg-white p-2.5 shadow-lg">
        <Gift className="size-6 text-violet-600" />
      </div>
      <div className="lift rounded-3xl bg-navy-900 p-6 text-center shadow-xl">
        <p className="text-2xl">🎉</p>
        <p className="mt-1 text-lg font-bold text-white">Vous avez gagné !</p>
        <p className="text-sm text-turquoise-200">Un dessert offert</p>
        <p className="mt-4 rounded-xl bg-white px-4 py-2.5 font-mono text-xl font-bold tracking-[0.25em] text-navy-900">
          K7X2M9PQ
        </p>
        <p className="mt-3 text-[10px] text-navy-300">
          Code unique, valable 30 jours, à présenter en caisse
        </p>
      </div>
    </div>
  );
}

/** Trois mini-cartes magasins — multi-établissements. */
export function StoresMockup() {
  const stores = [
    { name: 'Magasin 1 — Paris', value: 178, top: 'Instagram' },
    { name: 'Magasin 2 — Lyon', value: 141, top: 'Google' },
    { name: 'Magasin 3 — Marseille', value: 93, top: 'Bouche-à-oreille' },
  ];
  const max = Math.max(...stores.map((s) => s.value));
  return (
    <div className="space-y-3" aria-hidden>
      {stores.map((store) => (
        <div
          key={store.name}
          className="lift flex items-center gap-3 rounded-2xl border border-navy-100 bg-white px-4 py-3 shadow-md"
        >
          <span className="rounded-xl bg-navy-50 p-2 text-navy-700">
            {store.top === 'Google' ? (
              <Search className="size-4" />
            ) : store.top === 'Instagram' ? (
              <TrendingUp className="size-4" />
            ) : (
              <MessagesSquare className="size-4" />
            )}
          </span>
          <div className="flex-1">
            <p className="text-xs font-bold text-navy-900">{store.name}</p>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-navy-500"
                style={{ width: `${(store.value / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-navy-900 tabular-nums">{store.value}</p>
            <p className="text-[10px] text-navy-400">nº1 : {store.top}</p>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-navy-300">Données de démonstration</p>
    </div>
  );
}

/**
 * Photo d'ambiance auto-hébergée (public/images/), 3:2, optimisée.
 * Dimensions explicites pour éviter tout décalage de mise en page ;
 * chargement différé car toujours sous la ligne de flottaison.
 */
export function Photo({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={1200}
      height={800}
      loading="lazy"
      decoding="async"
      className={`lift aspect-[3/2] w-full rounded-3xl object-cover shadow-xl ${className}`}
    />
  );
}
