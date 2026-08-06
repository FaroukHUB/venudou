# VenuD'où — SEO, GEO et architecture publique

## Architecture des URL

### Pages publiques indexables (pré-rendues statiquement)

| URL                                            | Rôle                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/`                                            | Accueil — promesse « Comprenez d'où viennent vos clients. »                                         |
| `/fonctionnalites`                             | Vue d'ensemble produit                                                                              |
| `/tarifs`                                      | Offres provisoires (source unique `src/marketing/content/pricing.ts`, alignée sur la table `plans`) |
| `/restaurants`, `/magasins`                    | Pages sectorielles                                                                                  |
| `/multi-etablissements`                        | Comparaison multi-sites (réseaux, franchises)                                                       |
| `/provenance-client`                           | Page stratégique « logiciel provenance client / mesurer le bouche-à-oreille »                       |
| `/avis-google`                                 | « Obtenir plus d'avis Google en magasin »                                                           |
| `/instant-gagnant`                             | Récompenses en point de vente                                                                       |
| `/tablette-client`                             | « Questionnaire client sur tablette / enquête point de vente »                                      |
| `/faq`                                         | FAQ utile (rédigée pour les utilisateurs, pas pour un rich result)                                  |
| `/guides`, `/blog`                             | Index éditoriaux (structure prête, contenus à venir)                                                |
| `/cas-clients`, `/cas-clients/trust-industrie` | Études de cas (pilote clairement identifié, aucun chiffre inventé)                                  |

Extension prévue : `/guides/:slug`, `/blog/:slug`, `/cas-clients/:slug` via le
même registre (`src/marketing/routes.tsx` + `PUBLIC_PAGES` dans
`src/marketing/seo.ts`). Le contenu éditorial pourra venir de fichiers
Markdown/MDX ou d'une source remplaçable : il suffit d'ajouter une entrée
(meta + composant) pour qu'une page soit pré-rendue, testée et ajoutée au
sitemap automatiquement.

### Pages privées / techniques — noindex, hors sitemap

`/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/bienvenue`, `/app/*`,
`/kiosk/*`, `/super-admin/*`, `/r/:code`, `/api/*`.

Triple protection : `<meta name="robots" content="noindex">` dans le shell SPA,
en-tête `X-Robots-Tag: noindex, nofollow` ajouté par le Worker, et `Disallow`
dans `robots.txt`. Jamais dans le sitemap.

## Rendu

Les pages publiques sont des composants React **rendus en HTML statique au
build** (`scripts/prerender.mjs` + `src/marketing/prerender-entry.tsx`) : le
contenu principal est dans la réponse HTML initiale, sans dépendre de
JavaScript (le menu mobile et les FAQ utilisent `details/summary`). Servies par
Cloudflare Static Assets (cache CDN). Le dashboard, le kiosque et le
super-admin restent des applications React côté client, non indexables.

## Métadonnées

Système centralisé et typé : `PUBLIC_PAGES` dans `src/marketing/seo.ts`.
Chaque page déclare : `title` unique, `description` unique, canonique absolue
(`canonicalUrl`), breadcrumb, et infos article (auteur, datePublished,
dateModified) le cas échéant. `renderHeadTags()` génère : title, description,
canonical, robots, Open Graph (type, site_name, title, description, url,
image, locale), Twitter Cards, et les JSON-LD.

Langue : `<html lang="fr">` sur toutes les pages.

## Données structurées (JSON-LD)

Uniquement du balisage correspondant au contenu visible :

- Accueil : `Organization`, `WebSite`, `SoftwareApplication` ;
- Pages internes : `BreadcrumbList` (fil d'Ariane affiché) ;
- Études de cas / futurs articles : `Article` avec auteur, datePublished,
  dateModified.

Pas de `FAQPage` forcé, pas de balisage trompeur. Validité vérifiée par
`tests/seo.test.ts` (sérialisation + types attendus).

## Indexation

- `robots.txt` généré au build : `Allow: /`, `Disallow` sur tous les espaces
  privés, référence du sitemap.
- `sitemap.xml` généré au build depuis `PUBLIC_PAGES` (loc + lastmod) —
  les pages privées n'y figurent jamais (testé).
- 404 : `404.html` pré-rendue, servie avec un **statut HTTP 404 réel** par le
  Worker (testé par Playwright).
- Redirections permanentes : à déclarer dans le Worker (`worker/index.ts`)
  lors de tout changement d'URL — aucune URL modifiée à ce jour.
- Canoniques cohérentes : absolues, sans slash final (sauf `/`).

## GEO — moteurs génératifs

Entité définie de façon cohérente sur tout le site (header, footer, accueil,
JSON-LD `Organization`/`SoftwareApplication`) :

- **Nom** : VenuD'où
- **Catégorie** : logiciel SaaS de connaissance client et d'attribution des
  visites physiques
- **Promesse** : « Comprenez d'où viennent vos clients. »
- **Publics** : restaurants, magasins, commerces, réseaux multi-établissements,
  franchises
- **Fonctions** : mesure de provenance, segmentation âge/genre, questionnaires
  sur tablette, statistiques par établissement, comparaison multi-sites,
  collecte et suivi des demandes d'avis, instant gagnant

Rédaction : réponses dès le début des sections, définitions précises (ex.
« Qu'est-ce que la provenance client ? »), exemples concrets marqués comme
illustratifs, étude de cas pilote sans chiffres inventés, auteurs et dates sur
les contenus de type article. Aucun hack GEO artificiel, aucun fichier
« obligatoire » sans justification.

## Maillage interne

- Accueil → fonctionnalités, secteurs, tarifs, FAQ, cas client ;
- fonctionnalités ⇄ pages produit (`/provenance-client`, `/avis-google`,
  `/instant-gagnant`, `/tablette-client`) ;
- secteurs → cas d'usage et étude de cas ;
- étude de cas → fonctionnalités utilisées ;
- footer : trois colonnes (produit, secteurs, ressources) présentes sur toutes
  les pages — aucune page orpheline ;
- fil d'Ariane sur toutes les pages profondes.

## Performance (objectifs Lighthouse pages publiques)

SEO ≥ 95, accessibilité ≥ 90, bonnes pratiques ≥ 90, performance ≥ 90.

Leviers en place : HTML statique sans JavaScript applicatif sur les pages
publiques (seul le CSS est chargé), SVG légers avec dimensions explicites,
police Nunito auto-hébergée en `font-display: swap` (aucun appel externe ni
blocage de rendu), cache CDN Cloudflare, pas de
décalage de mise en page (dimensions fixées), lazy loading réservé aux
contenus hors écran (aucun sur le contenu principal). À mesurer sur le
déploiement réel après mise en production.

## Tests automatisés (tests/seo.test.ts, tests/marketing-pages.test.tsx, e2e/)

- title + description uniques et bornés pour chaque page publique ;
- canonique absolue présente ;
- un seul `h1` par page ; balises `header/main/footer` présentes ;
- contenu significatif dans le HTML généré (> 3 ko par page) ;
- aucune meta noindex sur les pages publiques ; noindex vérifié sur les
  routes privées (en-tête contrôlé par Playwright) ;
- JSON-LD sérialisables et typés (`Organization`, `WebSite`,
  `SoftwareApplication`, `BreadcrumbList`, `Article`) ;
- sitemap : toutes les routes publiques présentes, aucune route privée ;
- robots.txt : espaces privés bloqués, sitemap référencé ;
- 404 avec statut HTTP réel.

## Procédure Search Console (après déploiement)

1. Déployer sur le domaine définitif et renseigner `VITE_PUBLIC_BASE_URL` +
   secret Worker `PUBLIC_BASE_URL` avec ce domaine, puis rebuild.
2. Ajouter la propriété du domaine dans Google Search Console (validation DNS).
3. Soumettre `https://<domaine>/sitemap.xml`.
4. Vérifier l'inspection d'URL sur `/`, `/fonctionnalites`, `/tarifs`
   (rendu = HTML complet, canonique correcte).
5. Contrôler après quelques jours : couverture, pages exclues par noindex
   (doivent être uniquement les espaces privés).
6. Surveiller les Core Web Vitals et refaire un audit Lighthouse.
