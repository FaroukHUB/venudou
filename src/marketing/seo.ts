/**
 * Système SEO centralisé et typé : chaque page publique déclare ici son
 * title, sa description, sa canonique et ses données structurées.
 * Utilisé par le pré-rendu statique, le sitemap et les tests SEO.
 */

export const SITE = {
  name: "VenuD'où",
  baseUrl: import.meta.env?.VITE_PUBLIC_BASE_URL ?? 'https://venudou.example.com',
  tagline: "Comprenez d'où viennent vos clients.",
  description:
    "VenuD'où est un logiciel SaaS de connaissance client et d'attribution des visites physiques : une tablette à la caisse mesure comment vos clients ont découvert chaque établissement.",
  lang: 'fr',
  socialImage: '/brand/logo-full.svg',
} as const;

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  /** Fil d'Ariane (libellés), racine implicite = Accueil. */
  breadcrumb?: string[];
  /** Article/BlogPosting (études de cas, guides, articles). */
  article?: { author: string; datePublished: string; dateModified: string };
  /** Inclus dans le sitemap (true par défaut). */
  sitemap?: boolean;
}

export const PUBLIC_PAGES: PageMeta[] = [
  {
    path: '/',
    title: "VenuD'où — Comprenez d'où viennent vos clients",
    description:
      'Mesurez comment vos clients ont découvert votre commerce grâce à une tablette en caisse : provenance, profil, comparaison multi-établissements et avis Google.',
  },
  {
    path: '/fonctionnalites',
    title: "Fonctionnalités — questionnaire tablette, statistiques, avis | VenuD'où",
    description:
      "Questionnaire personnalisable sur tablette, statistiques par établissement, comparaison multi-sites, suivi des demandes d'avis Google et instant gagnant.",
    breadcrumb: ['Fonctionnalités'],
  },
  {
    path: '/tarifs',
    title: "Tarifs — offres VenuD'où de 1 à 10 établissements et plus",
    description:
      "Des offres claires selon votre nombre d'établissements : Essentiel, Pro, Réseau, Réseau Plus et Entreprise sur mesure. Essai sans engagement.",
    breadcrumb: ['Tarifs'],
  },
  {
    path: '/restaurants',
    title: "VenuD'où pour les restaurants — statistiques clients en salle",
    description:
      'Sachez si vos clients viennent par Instagram, Google ou le bouche-à-oreille, mesurez le profil de votre clientèle et obtenez plus d’avis Google, service après service.',
    breadcrumb: ['Restaurants'],
  },
  {
    path: '/magasins',
    title: "VenuD'où pour les magasins — analysez les visiteurs de votre boutique",
    description:
      "Analysez les visiteurs de votre magasin : canaux d'acquisition, tranches d'âge, comparaison entre boutiques et collecte d'avis Google à la caisse.",
    breadcrumb: ['Magasins'],
  },
  {
    path: '/multi-etablissements',
    title: "Comparer plusieurs établissements — VenuD'où multi-sites",
    description:
      'Réseaux et franchises : statistiques séparées par établissement, vue globale centralisée et comparaison claire des provenances entre vos magasins.',
    breadcrumb: ['Multi-établissements'],
  },
  {
    path: '/provenance-client',
    title: 'Logiciel de provenance client — savoir comment vos clients vous ont connu',
    description:
      'Le questionnaire en point de vente qui mesure le bouche-à-oreille, les réseaux sociaux et Google : des données fiables, collectées en caisse en quelques secondes.',
    breadcrumb: ['Provenance client'],
  },
  {
    path: '/avis-google',
    title: "Obtenir plus d'avis Google en magasin — VenuD'où",
    description:
      "Après le questionnaire, la tablette propose un QR code vers votre page d'avis Google. Suivi des scans par établissement, sans jamais filtrer les clients.",
    breadcrumb: ['Avis Google'],
  },
  {
    path: '/instant-gagnant',
    title: 'Instant gagnant en point de vente — récompensez la participation',
    description:
      'Un gagnant toutes les N participations, tiré au sort de façon sécurisée : codes uniques, QR codes, validation en caisse. Configurable par établissement.',
    breadcrumb: ['Instant gagnant'],
  },
  {
    path: '/tablette-client',
    title: 'Questionnaire client sur tablette — enquête en point de vente',
    description:
      "Une tablette à la caisse, trois questions, moins de 15 secondes : provenance, genre, tranche d'âge. Fonctionne même hors ligne et se synchronise automatiquement.",
    breadcrumb: ['Tablette client'],
  },
  {
    path: '/faq',
    title: "FAQ — questions fréquentes sur VenuD'où",
    description:
      "Installation de la tablette, RGPD et anonymat, avis Google, offres et limites d'établissements : les réponses aux questions les plus fréquentes.",
    breadcrumb: ['FAQ'],
  },
  {
    path: '/guides',
    title: "Guides — connaissance client et marketing local | VenuD'où",
    description:
      'Guides pratiques pour les commerces et restaurants : mesurer le bouche-à-oreille, améliorer sa visibilité locale et exploiter ses statistiques clients.',
    breadcrumb: ['Guides'],
  },
  {
    path: '/blog',
    title: "Blog VenuD'où — connaissance client, avis Google, marketing local",
    description:
      "Articles sur la connaissance client, l'expérience en point de vente, les avis Google et les réseaux multi-établissements.",
    breadcrumb: ['Blog'],
  },
  {
    path: '/cas-clients',
    title: "Cas clients — ils mesurent la provenance de leurs clients | VenuD'où",
    description:
      "Études de cas de commerces et restaurants qui utilisent VenuD'où pour comprendre d'où viennent leurs clients et comparer leurs établissements.",
    breadcrumb: ['Cas clients'],
  },
  {
    path: '/cas-clients/trust-industrie',
    title: "Trust Industrie : 3 magasins pilotes sur VenuD'où",
    description:
      "Comment Trust Industrie, client pilote de VenuD'où, déploie une tablette dans chacun de ses 3 magasins pour comparer la provenance de ses clients.",
    breadcrumb: ['Cas clients', 'Trust Industrie'],
    article: { author: "Équipe VenuD'où", datePublished: '2026-08-06', dateModified: '2026-08-06' },
  },
];

/** Préfixes privés/techniques : noindex, jamais dans le sitemap. */
export const PRIVATE_PREFIXES = [
  '/connexion',
  '/inscription',
  '/mot-de-passe-oublie',
  '/bienvenue',
  '/app',
  '/kiosk',
  '/super-admin',
  '/r/',
  '/api/',
];

export function metaForPath(path: string): PageMeta | undefined {
  return PUBLIC_PAGES.find((p) => p.path === path);
}

export function canonicalUrl(path: string): string {
  return `${SITE.baseUrl}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
}

// ------------------------------------------------------------
// JSON-LD — uniquement des données correspondant au contenu visible
// ------------------------------------------------------------

export function jsonLdForPage(meta: PageMeta): object[] {
  const blocks: object[] = [];
  if (meta.path === '/') {
    blocks.push(
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE.name,
        url: SITE.baseUrl,
        slogan: SITE.tagline,
        logo: `${SITE.baseUrl}/brand/logo-full.svg`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE.name,
        url: SITE.baseUrl,
        inLanguage: 'fr',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: SITE.name,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: SITE.description,
        url: SITE.baseUrl,
      },
    );
  }
  if (meta.breadcrumb && meta.breadcrumb.length > 0) {
    const items = [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: canonicalUrl('/') },
      ...meta.breadcrumb.map((name, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name,
        item: canonicalUrl(meta.path),
      })),
    ];
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    });
  }
  if (meta.article) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: meta.title,
      description: meta.description,
      author: { '@type': 'Organization', name: meta.article.author },
      datePublished: meta.article.datePublished,
      dateModified: meta.article.dateModified,
      mainEntityOfPage: canonicalUrl(meta.path),
      inLanguage: 'fr',
    });
  }
  return blocks;
}

/** Balises <head> complètes d'une page publique (pré-rendu). */
export function renderHeadTags(meta: PageMeta): string {
  const canonical = canonicalUrl(meta.path);
  const jsonLd = jsonLdForPage(meta)
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n    ');
  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="${meta.article ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${SITE.baseUrl}${SITE.socialImage}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${SITE.baseUrl}${SITE.socialImage}" />`,
    jsonLd,
  ].join('\n    ');
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
