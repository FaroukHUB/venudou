# VenuD'où

> **Comprenez d'où viennent vos clients.**
> SaaS multi-entreprises d'attribution des visites physiques : une tablette à
> la caisse mesure comment les clients ont découvert chaque établissement,
> avec statistiques par magasin, comparaison multi-sites, collecte d'avis
> Google et instant gagnant.

Documentation détaillée : [ARCHITECTURE.md](ARCHITECTURE.md) ·
[DATABASE.md](DATABASE.md) · [SEO.md](SEO.md) · [ROADMAP.md](ROADMAP.md)

## Stack

React 19 + Vite 7 + TypeScript strict + Tailwind CSS 4 + React Router 7 ·
Cloudflare Workers + Static Assets (plugin Vite officiel, Worker Hono) ·
Supabase (PostgreSQL, Auth, RLS) · PWA + IndexedDB pour le kiosque hors ligne ·
Zod · Recharts · Lucide.

## Démarrage

```bash
npm install

# Variables d'environnement (jamais de vraies clés dans Git)
cp .env.example .env            # frontend : URL Supabase + clé anon publique
cp .dev.vars.example .dev.vars  # worker : URL Supabase + clé service_role (SECRÈTE)

npm run dev                     # http://localhost:5173 (SPA + Worker via le plugin Cloudflare)
```

### Variables nécessaires

| Variable                    | Où                            | Rôle                                                                |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | `.env` (frontend)             | URL du projet Supabase                                              |
| `VITE_SUPABASE_ANON_KEY`    | `.env` (frontend)             | Clé anon publique (protégée par RLS)                                |
| `VITE_PUBLIC_BASE_URL`      | `.env` (frontend/build)       | Domaine public (canoniques, sitemap, QR)                            |
| `SUPABASE_URL`              | `.dev.vars` / secret Wrangler | URL du projet (Worker)                                              |
| `SUPABASE_SERVICE_ROLE_KEY` | `.dev.vars` / secret Wrangler | Clé service — **uniquement côté Worker, jamais dans le navigateur** |
| `PUBLIC_BASE_URL`           | `.dev.vars` / secret Wrangler | Domaine public côté Worker                                          |

En production : `wrangler secret put SUPABASE_URL`, etc. Les e-mails
(confirmation, réinitialisation) partent via Supabase Auth avec le SMTP Brevo
configuré dans le dashboard Supabase — rien à configurer dans ce dépôt.

## Base de données

Migrations versionnées dans `supabase/migrations/` (à appliquer **dans
l'ordre**, après relecture — voir [DATABASE.md](DATABASE.md)) :

1. `0001_core.sql` — multi-tenant (profils, organisations, membres, plans,
   abonnements, établissements, tablettes, audit)
2. `0002_questionnaires.sql` — questionnaires, questions, options, sessions,
   réponses + configuration par défaut
3. `0003_reviews_rewards.sql` — avis, événements, campagnes, codes de gain
4. `0004_functions.sql` — fonctions métier `security definer`
5. `0005_rls.sql` — RLS et politiques sur toutes les tables

Ensuite : `supabase/seed.sql` (développement — Trust Industrie, 3 magasins,
accès gratuit) et `supabase/tests/checks.sql` (vérifications SQL sur base de
test). Pour promouvoir un super-admin (clé service uniquement) :
`insert into public.super_admins (user_id) values ('<uuid>');`

## Commandes

```bash
npm run dev        # développement
npm run lint       # ESLint + Prettier
npm run typecheck  # tsc strict (front + worker)
npm run test       # Vitest (42 tests : SEO, stats, kiosque hors ligne, aide, UI)
npm run build      # build client + worker + pré-rendu statique des pages publiques
npm run test:e2e   # Playwright contre le build (workerd) : site public, 404, noindex, kiosque
npm run deploy     # build + wrangler deploy (NE PAS lancer sans validation)
```

## Espaces de l'application

| Espace           | Routes                                               | Notes                                                                                                             |
| ---------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Site public      | `/`, `/fonctionnalites`, `/tarifs`, …                | Pré-rendu statique, SEO complet (voir SEO.md)                                                                     |
| Auth             | `/connexion`, `/inscription`, `/mot-de-passe-oublie` | Supabase Auth                                                                                                     |
| Dashboard client | `/app/*`                                             | Vue générale, établissements, tablettes, questionnaire, récompenses, avis, statistiques, équipe, abonnement, aide |
| Kiosque          | `/kiosk` (activation), `/kiosk/session`              | Plein écran, hors ligne (IndexedDB + PWA)                                                                         |
| Suivi avis       | `/r/:trackingCode`                                   | Worker : événement + redirection 302                                                                              |
| Super-admin      | `/super-admin/*`                                     | Rôle porté par la table `super_admins` (clé service uniquement)                                                   |

## Parcours d'installation d'une tablette

1. Dashboard → Tablettes → créer une tablette (rattachée à un établissement).
2. « Code d'activation » → code court, valable 15 min, à usage unique.
3. Sur la tablette : ouvrir `/kiosk`, saisir le code.
4. Le Worker valide le code, génère un jeton d'appareil (stocké haché en
   base), la tablette ouvre le questionnaire en plein écran.

## Sécurité — points clés

- RLS activée sur toutes les tables ; isolation stricte par organisation ;
  les réponses ne sont jamais lisibles publiquement.
- Clé `service_role` uniquement en secret Worker ; le frontend n'a que la clé
  anon.
- Jetons tablettes et codes d'activation stockés **hachés** (SHA-256).
- Sessions idempotentes (`client_session_id` unique) — la synchro hors ligne
  ne crée pas de doublons ; limitation de débit sur les endpoints kiosque.
- Aucune donnée nominative visiteur, aucune IP stockée ; audit des actions
  sensibles dans `audit_logs`.

## Tests critiques — couverture

| Scénario                                             | Où                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Création de compte / organisation / établissement    | UI + RPC `create_organization_with_owner` (e2e complet à brancher sur un projet Supabase de test) |
| Blocage à la limite d'établissements                 | trigger SQL + `supabase/tests/checks.sql` (§1) + message UI                                       |
| Génération / activation code tablette (usage unique) | `checks.sql` (§3) + e2e kiosque (code invalide refusé)                                            |
| Questionnaire complet + config par défaut            | `checks.sql` (§2) + Vitest kiosque                                                                |
| Hors ligne puis synchronisation sans doublon         | `tests/kiosk-offline.test.ts` + `checks.sql` (§4)                                                 |
| Isolation entre organisations                        | politiques RLS (`0005_rls.sql`) + procédure `checks.sql` (§6)                                     |
| Génération d'un gain / non-réutilisation             | `checks.sql` (§4–5) + RPC `redeem_reward_code`                                                    |
| Redirection lien d'avis + 404 + noindex              | Playwright `e2e/public-site.spec.ts`                                                              |
| Filtrage des statistiques par établissement          | `tests/stats.test.ts`                                                                             |

## Déploiement (à valider avant toute action)

1. Appliquer les migrations sur le projet Supabase (après relecture).
2. `wrangler secret put SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / PUBLIC_BASE_URL`.
3. `npm run deploy` (Cloudflare Workers + Static Assets).
4. Search Console : voir la procédure dans [SEO.md](SEO.md).

Aucun déploiement Cloudflare ni modification distante Supabase ne doit être
fait sans validation explicite.
