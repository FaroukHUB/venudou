# VenuD'où — Architecture technique

> SaaS multi-entreprises d'attribution des visites physiques : une tablette à la
> caisse permet aux commerces, restaurants et magasins de comprendre comment
> leurs clients les ont découverts.

## 1. Vue d'ensemble

Une seule application, une seule base de données, cinq espaces :

| Espace | Routes | Rendu | Indexation |
| --- | --- | --- | --- |
| Site commercial public | `/`, `/fonctionnalites`, `/tarifs`, `/restaurants`, … | **Pré-rendu statique** à la compilation (HTML complet dans la réponse initiale) | Indexable |
| Authentification | `/connexion`, `/inscription`, `/mot-de-passe-oublie` | SPA React | `noindex` |
| Tableau de bord client | `/app/*` | SPA React | `noindex` |
| Kiosque tablette | `/kiosk`, `/kiosk/session` | SPA React + PWA + IndexedDB (hors ligne) | `noindex` |
| Super-admin VenuD'où | `/super-admin/*` | SPA React | `noindex` |

Route serveur supplémentaire : `/r/:trackingCode` (suivi puis redirection vers
le lien d'avis Google de l'établissement) et `/api/*` (endpoints du kiosque).

## 2. Stack

- **Frontend** : React 19, Vite 7, TypeScript strict, Tailwind CSS 4,
  React Router 7, Lucide React (icônes), Recharts (graphiques).
- **PWA** : manifest + service worker maison (`public/kiosk-sw.js`) enregistré
  uniquement sur le kiosque ; file d'attente IndexedDB (`idb`) pour le hors
  ligne.
- **Déploiement** : Cloudflare Workers + Static Assets via le plugin Vite
  officiel `@cloudflare/vite-plugin` ; un Worker TypeScript (Hono) pour les
  routes serveur.
- **Backend / données** : Supabase (PostgreSQL + Auth + RLS), migrations SQL
  versionnées dans `supabase/migrations/`.
- **E-mails** : Supabase Auth (SMTP Brevo configuré dans le dashboard Supabase
  — aucun réglage dans ce dépôt).
- **Validation** : Zod côté Worker (toutes les entrées kiosque) et côté client.

Exclusions volontaires (imposées) : pas de Vercel, Firebase, Cloudflare D1,
Next.js, WordPress, FastAPI, ni seconde base de données.

## 3. Rendu et build

### Pipeline de build

```
npm run build
 ├─ 1. vite build                 → dist/client (SPA + assets) + Worker
 ├─ 2. vite build (config prerender, SSR) → dist/prerender (bundle serveur)
 └─ 3. node scripts/prerender.mjs → pages publiques pré-rendues en HTML statique
        - dist/client/index.html (accueil), /fonctionnalites/index.html, …
        - copie du shell SPA vers dist/client/app-shell.html
        - génération de robots.txt, sitemap.xml, 404.html
```

Les pages publiques sont des composants React **rendus en HTML statique au
build** (`react-dom/server`). Le HTML servi contient tout le contenu principal
sans dépendre de JavaScript. En développement (`npm run dev`), ces mêmes
composants sont servis par le routeur SPA pour un feedback immédiat — le rendu
de production reste statique.

### Routage à l'exécution (Cloudflare)

1. **Static Assets d'abord** : les pages publiques pré-rendues et les assets
   sont servis directement par Cloudflare (rapide, en cache).
2. **Worker ensuite** (requêtes sans asset correspondant) :
   - `/api/*` → endpoints JSON (kiosque, activation, sessions) ;
   - `/r/:trackingCode` → enregistrement de l'événement + redirection 302 ;
   - routes privées (`/app*`, `/kiosk*`, `/super-admin*`, `/connexion`, …) →
     sert `app-shell.html` (SPA) avec l'en-tête `X-Robots-Tag: noindex` ;
   - tout le reste → `404.html` avec un statut HTTP 404 réel.

## 4. Modèle multi-entreprises

- Une organisation (`organizations`) possède des établissements (`locations`),
  des tablettes (`devices`), des questionnaires, des campagnes de récompenses…
- Chaque table métier porte `organization_id` (et `location_id` si pertinent).
- Un utilisateur appartient à 1..n organisations via `organization_members`
  (rôles `organization_owner`, `organization_admin`, `location_manager`).
- Les `location_manager` sont restreints aux établissements listés dans
  `member_locations`.
- Le rôle `super_admin` est porté par la table dédiée `super_admins`,
  modifiable uniquement avec la clé service (jamais depuis le navigateur).
- L'isolation est garantie par **RLS sur toutes les tables** (voir
  `DATABASE.md`) — jamais par du filtrage côté client.

## 5. Sécurité

- La clé `service_role` Supabase n'existe **que** comme secret du Worker
  (`wrangler secret put SUPABASE_SERVICE_ROLE_KEY`). Le frontend n'utilise que
  la clé `anon`, protégée par RLS.
- Jetons de tablette : générés aléatoirement (32 octets), **stockés hachés
  (SHA-256)** en base ; le jeton en clair ne vit que sur la tablette.
- Codes d'activation : courts, à usage unique, expirés après 15 minutes,
  stockés hachés.
- Anti-doublon kiosque : `client_session_id` (UUID généré sur la tablette) est
  unique en base — la synchronisation hors ligne est idempotente.
- Limitation de débit sur les endpoints kiosque (compteur en mémoire du
  Worker) ; **aucune adresse IP de visiteur n'est stockée**.
- Aucune donnée nominative demandée aux visiteurs ; les statistiques sont
  anonymes par construction.
- Actions administratives sensibles journalisées dans `audit_logs`.
- Zod valide toutes les entrées côté Worker ; TypeScript `strict` partout.

## 6. Kiosque hors ligne

1. La configuration du questionnaire est mise en cache localement
   (IndexedDB) à chaque récupération réussie.
2. Chaque session terminée est écrite dans la file `pending_sessions`
   (IndexedDB) avec un UUID client, puis envoyée au Worker.
3. La synchronisation se déclenche : à la fin d'une session, au retour du
   réseau (`online`), et périodiquement.
4. Le serveur ignore les doublons (`client_session_id` unique) — un envoi
   répété est sans effet.
5. Le service worker met en cache le shell et les assets pour que le
   questionnaire fonctionne sans réseau après la première ouverture.
6. Limite volontaire du MVP : le tirage « instant gagnant » et la proposition
   d'avis nécessitent le réseau ; hors ligne, la session est enregistrée et le
   kiosque remercie simplement le client.

## 7. Récompenses (« instant gagnant »)

Le tirage est effectué **en base de données** dans une fonction SQL
`security definer` appelée par le Worker (jamais côté client) :

- pour chaque bloc de N participations, une position gagnante est tirée avec
  `pgcrypto` (aléa cryptographique) et stockée dans `reward_blocks` ;
- la position n'est jamais exposée à l'avance ;
- le gain crée un `reward_code` unique (affiché en QR code sur la tablette),
  utilisable une seule fois, avec statuts `available / redeemed / expired /
  cancelled` ;
- le commerçant valide un code depuis `/app/recompenses` (RPC `redeem_reward_code`
  protégée par RLS).

La récompense n'est jamais conditionnée à la publication d'un avis Google.

## 8. Avis Google

- Chaque établissement enregistre son lien d'avis (`review_links`) avec un
  `tracking_code` court.
- Après le questionnaire (et l'éventuel gain), la tablette propose de laisser
  un avis. Les événements mesurés : `prompt_shown`, `accepted`, `declined`,
  `qr_displayed`, `link_opened` (via `/r/:trackingCode`).
- Aucun filtrage par satisfaction, aucune prétention à mesurer la publication
  réelle de l'avis.

## 9. Centre d'aide

Base locale de questions/réponses (`src/help/`) : documentation par thèmes,
recherche plein texte simple, assistant guidé à base de règles, réponses
contextuelles selon la page. L'interface `AssistantProvider`
(`src/help/provider.ts`) permet de brancher plus tard un fournisseur d'IA sans
réécrire l'UI. Aucune API d'IA payante dans le MVP.

## 10. Identité visuelle

Tokens définis dans `src/index.css` (`@theme` Tailwind 4) :

- `--color-navy-*` : bleu marine (principal) ;
- `--color-turquoise-*` : turquoise (principal) ;
- blanc / gris très clair pour les fonds ;
- `--color-violet-*` : violet, **uniquement** couleur secondaire pour
  certaines statistiques/catégories.

Emplacements de logo (placeholders propres, à remplacer par le logo validé) :
`public/brand/logo-full.svg`, `public/brand/logo-mark.svg`,
`public/favicon.svg`, `public/icons/pwa-icon.svg` — voir
`public/brand/README.md`.

## 11. Arborescence

```
worker/            Worker Cloudflare (Hono) : /api/*, /r/:code, routage SPA/404
src/marketing/     Pages publiques pré-rendues (SEO) + contenu éditorial
src/auth/          Connexion, inscription, mot de passe oublié, onboarding
src/app/           Tableau de bord client (/app/*)
src/kiosk/         Activation + questionnaire plein écran
src/superadmin/    Super-administration (/super-admin/*)
src/help/          Centre d'aide et assistant local
src/components/    UI réutilisable (boutons, cartes, graphiques, layouts)
src/lib/           Client Supabase, contextes, SEO, file IndexedDB
supabase/          Migrations SQL versionnées + seed de développement
scripts/           Pré-rendu statique, génération sitemap/robots
tests/             Vitest + React Testing Library (+ tests SEO)
e2e/               Playwright (parcours critiques)
```

## 12. Choix assumés / limites du MVP

- **Pas de Stripe** : les tables `plans` / `organization_subscriptions`
  modélisent déjà quotas, essai, gratuité et override admin ; le paiement se
  branchera dessus.
- **Statistiques** : agrégation côté client sur des requêtes filtrées et
  indexées (volumes MVP) ; des vues matérialisées pourront prendre le relais.
- **Invitations d'équipe** : ajout par e-mail d'un compte existant (RPC) ;
  l'invitation e-mail complète viendra ensuite via Supabase Auth.
- **Tarifs du site public** : générés au build depuis la même source que le
  seed des plans ; la vérité runtime reste la table `plans` (éditable en
  super-admin).
```
