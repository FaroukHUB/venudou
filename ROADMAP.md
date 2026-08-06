# VenuD'où — Roadmap

## Phase 0 — Fondations (cette livraison)
- [x] Analyse du dépôt (vide) et documents d'architecture
- [x] Scaffold Vite + React 19 + TypeScript strict + Tailwind 4
- [x] Plugin Vite Cloudflare + Worker Hono + configuration Wrangler
- [x] Charte VenuD'où en tokens Tailwind, composants UI de base
- [x] Emplacements de logo (placeholders) + favicon + manifest PWA
- [x] Client Supabase + contexte d'authentification
- [x] Migrations SQL multi-tenant complètes + RLS + fonctions métier
- [x] ESLint, Prettier, Vitest, RTL, Playwright, CI locale (lint/test/build)

## Phase 1 — Authentification et multi-entreprises (cette livraison)
- [x] Inscription, connexion, mot de passe oublié (Supabase Auth + Brevo SMTP)
- [x] Onboarding : création d'organisation (RPC atomique)
- [x] Sélecteur d'organisation (multi-adhésion), rôles et gardes de routes

## Phase 2 — Établissements et tablettes (cette livraison)
- [x] CRUD établissements + application de la limite du plan
- [x] Création de tablettes, code d'activation court à usage unique
- [x] Activation `/kiosk`, jeton haché, statut en ligne / hors ligne

## Phase 3 — Kiosque et questionnaires (cette livraison)
- [x] Éditeur de questionnaire par établissement (ordre, libellés, icônes,
      activation, obligatoire/facultatif, prévisualisation, publication)
- [x] Parcours tablette plein écran (progression, gros boutons, anti double
      clic, retour automatique)
- [x] Hors ligne : file IndexedDB + synchronisation idempotente

## Phase 4 — Statistiques (cette livraison)
- [x] Vue générale (jour/semaine/mois, provenance principale, scans avis,
      gains, tablettes en ligne)
- [x] Filtres période / établissement / tablette / provenance / genre / âge
- [x] Analyses : répartitions, évolution, croisements, comparaison
      multi-établissements (Trust Industrie : 3 magasins), volume jour × heure

## Phase 5 — Récompenses et avis (cette livraison)
- [x] Campagnes « instant gagnant » (types, fréquence N, plafonds, validité)
- [x] Tirage sécurisé en base, codes uniques + QR, validation commerçant
- [x] Liens d'avis par établissement, `/r/:code`, événements mesurés

## Phase 6 — Super-admin et centre d'aide (cette livraison)
- [x] Aperçu global, organisations (suspension, limites, gratuité), plans,
      abonnements, tablettes, volumes, journaux d'audit
- [x] Centre d'aide : articles, recherche, assistant guidé local,
      interface `AssistantProvider` abstraite

## Phase 7 — Site public et SEO (cette livraison)
- [x] Pages publiques pré-rendues (accueil, fonctionnalités, tarifs,
      secteurs, avis Google, tablette, FAQ, structure blog/guides,
      étude de cas pilote Trust Industrie)
- [x] Système de métadonnées typé, JSON-LD, sitemap, robots, 404, noindex
- [x] Tests SEO automatisés + SEO.md

## Phase 8 — Suite (hors MVP)
- [ ] Paiement Stripe branché sur `plans` / `organization_subscriptions`
- [ ] Invitations e-mail complètes (compte inexistant) via Supabase Auth
- [ ] Vues matérialisées / agrégats serveur pour les gros volumes
- [ ] Rate limiting distribué (Durable Objects) pour le kiosque
- [ ] Fournisseur d'IA branché sur `AssistantProvider`
- [ ] Éditorial : guides, blog, glossaire, comparatifs, pages sectorielles
- [ ] Multi-langue du kiosque ; export CSV des statistiques
- [ ] Procédure Search Console + suivi Lighthouse en CI

## Rituel de fin de phase
`npm run lint` → `npm run test` → `npm run build` → corrections → commit clair.
Aucun déploiement Cloudflare et aucune modification distante Supabase sans
validation explicite.
