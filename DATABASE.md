# VenuD'où — Base de données (Supabase PostgreSQL)

Migrations versionnées dans `supabase/migrations/` :

| Fichier                    | Contenu                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `0001_core.sql`            | Extensions, profils, super-admins, organisations, membres, plans, abonnements, établissements, tablettes, codes d'activation             |
| `0002_questionnaires.sql`  | Questionnaires, questions, options, sessions, réponses + configuration par défaut                                                        |
| `0003_reviews_rewards.sql` | Liens d'avis, événements d'avis, campagnes de récompenses, blocs de tirage, codes, validations, journaux d'audit                         |
| `0004_functions.sql`       | Fonctions métier (`security definer`) : création d'organisation, activation tablette, soumission de session + tirage, validation de gain |
| `0005_rls.sql`             | Activation RLS + politiques sur toutes les tables                                                                                        |

Seed de développement : `supabase/seed.sql` (plans + organisation pilote
« Trust Industrie » avec 3 établissements). Les plans sont aussi insérés par
migration (`on conflict do nothing`) car ce sont des données de référence.

## Application des migrations

```bash
# Avec la CLI Supabase liée au projet (ne rien exécuter sans relecture) :
supabase db push          # ou : supabase migration up
# Ou coller chaque fichier, dans l'ordre, dans le SQL Editor du dashboard.
```

Aucune migration ne doit être appliquée sur le projet distant sans relecture
préalable des politiques RLS.

## Schéma

Toutes les tables ont : `id uuid` (PK, `gen_random_uuid()`), `created_at`,
`updated_at` (trigger `set_updated_at`), et `organization_id` /
`location_id` lorsque la donnée est rattachée à une organisation ou un
établissement.

### Identité et tenancy

- **profiles** — 1:1 avec `auth.users` (trigger à l'inscription). `full_name`.
- **super_admins** — `user_id` PK. Ce rôle ne dépend d'aucune valeur
  modifiable depuis le navigateur : la table n'est modifiable qu'avec la clé
  service. Vérifié via `is_super_admin()` (`security definer`).
- **organizations** — `name`, `slug` unique, `status` (`active|suspended`).
- **organization_members** — `organization_id`, `user_id`, `role`
  (`organization_owner|organization_admin|location_manager`), unique par
  couple. Un utilisateur peut appartenir à plusieurs organisations.
- **member_locations** — restreint un `location_manager` à certains
  établissements.

### Offre commerciale

- **plans** — `code` unique (`essentiel|pro|reseau|reseau_plus|entreprise`),
  `name`, `max_locations` (NULL = sur mesure), `price_monthly_cents`,
  `currency`, `is_active`, `sort_order`. Éditable depuis le super-admin :
  aucun prix codé en dur dans les composants du dashboard.
- **organization_subscriptions** — `organization_id`, `plan_id`, `status`
  (`trialing|active|free|suspended|canceled`), `trial_ends_at`, `starts_at`,
  `ends_at`, `max_locations_override` (override admin), `notes`.
  La limite effective = `coalesce(max_locations_override, plans.max_locations)`,
  appliquée par trigger `enforce_location_limit` à l'insertion d'un
  établissement (et revérifiée côté UI).

### Établissements et tablettes

- **locations** — `organization_id`, `name`, `slug`, adresse, `city`,
  `timezone` (défaut `Europe/Paris`), `status`.
- **devices** — `organization_id`, `location_id`, `name`, `status`
  (`pending|active|disabled`), `token_hash` (SHA-256 du jeton, jamais le
  jeton en clair ; colonne exclue des `GRANT SELECT` clients),
  `activated_at`, `last_seen_at` (en ligne = vu il y a < 5 min).
- **device_activation_codes** — `device_id`, `code_hash` (code court haché),
  `expires_at` (15 min), `used_at`. Usage unique. Créés par RPC
  `create_device_activation_code` qui retourne le code en clair une seule fois.

### Questionnaires

- **questionnaires** — un par établissement (`location_id` unique),
  `published_at` (republication = mise à jour poussée aux tablettes).
- **questions** — `questionnaire_id`, `kind`
  (`source|gender|age_range|custom`), `label`, `enabled`, `required`,
  `allow_free_text` (champ « précisez » pour Autre), `position`.
- **question_options** — `question_id`, `label`, `value` (stable, pour les
  stats), `icon` (nom Lucide), `enabled`, `position`, `is_optout`
  (« Je préfère ne pas répondre » — non supprimable quand la question genre
  est active, garanti par trigger), `is_other`.

Configuration par défaut créée automatiquement pour chaque nouvel
établissement (fonction `create_default_questionnaire`) : provenance
(Facebook, Instagram, Snapchat, TikTok, Google, Bouche-à-oreille, Autre),
genre (Homme, Femme, Je préfère ne pas répondre), tranche d'âge (<18, 18–24,
25–34, 35–44, 45–54, 55+, Je préfère ne pas répondre).

### Sessions de réponse

- **survey_sessions** — `organization_id`, `location_id`, `device_id`,
  `questionnaire_id`, `client_session_id` **unique** (idempotence hors
  ligne), `channel` (`kiosk`), `started_at`, `completed_at`, `created_at`
  (heure serveur). Aucune donnée nominative, aucune IP.
- **survey_answers** — `session_id`, `question_id`, `option_id`,
  `free_text`, + dénormalisation pour les statistiques : `question_kind`,
  `option_value`, `option_label`, `organization_id`, `location_id`,
  `created_at`.

### Avis

- **review_links** — `location_id` unique, `provider` (`google`), `url`,
  `tracking_code` court unique (URL `/r/:trackingCode`), `is_active`.
- **review_events** — `organization_id`, `location_id`, `session_id?`,
  `event_type` (`prompt_shown|accepted|declined|qr_displayed|link_opened`).
  Insertion par le Worker uniquement. On ne prétend pas mesurer la
  publication réelle d'un avis.

### Récompenses

- **reward_campaigns** — par établissement : `reward_type`
  (`percent|fixed|product|drink|dessert|custom`), `reward_value`,
  `reward_label`, `frequency_n` (1 gagnant toutes les N participations),
  `max_discount_cents`, `min_order_cents`, `validity_days`, `terms`,
  `max_total_wins`, `wins_count`, `participations_count`,
  `accepted_location_ids uuid[]`, `is_active`.
- **reward_blocks** — `(campaign_id, block_index)` unique, `winning_offset`
  tiré avec `pgcrypto` au premier passage dans le bloc. Jamais lisible par
  les clients (aucune politique SELECT).
- **reward_codes** — `code` unique lisible (sans caractères ambigus),
  `status` (`available|redeemed|expired|cancelled`), `expires_at`,
  `redeemed_at`, `redeemed_by`, `redeemed_location_id`, `session_id`.
- **reward_redemptions** — trace de chaque validation.

### Audit

- **audit_logs** — `organization_id?`, `actor_user_id?`, `actor_role`,
  `action`, `target_type`, `target_id`, `metadata jsonb`. Alimenté par les
  fonctions sensibles (suspension, overrides, activation tablette,
  validation de gain, …).

## Index

Index sur tous les filtres du dashboard : `(organization_id, created_at)`,
`(location_id, created_at)` sur sessions/réponses/événements ;
`(question_id, option_id)` sur les réponses ; `device_id` ; `tracking_code` ;
`client_session_id` (unique) ; `code` (unique) ; membres par utilisateur et
par organisation. Voir les fichiers SQL pour la liste exhaustive.

## RLS — principes

RLS **activée sur toutes les tables**. Aucune table n'est lisible
publiquement. Résumé des politiques (détail dans `0005_rls.sql`) :

| Table                            | SELECT                                                      | INSERT/UPDATE/DELETE                                      |
| -------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| profiles                         | soi-même + super-admin                                      | soi-même (update)                                         |
| super_admins                     | soi-même (vérif. rôle)                                      | personne (service uniquement)                             |
| organizations                    | membres + super-admin                                       | owner/admin (update) ; création via RPC ; super-admin     |
| organization_members             | membres de l'org + soi-même                                 | owner/admin de l'org                                      |
| member_locations                 | membres de l'org                                            | owner/admin                                               |
| plans                            | tous (anon inclus, plans actifs) — tarifs publics           | super-admin                                               |
| organization_subscriptions       | membres                                                     | super-admin uniquement                                    |
| locations                        | owner/admin : toutes ; manager : les siennes                | owner/admin (limite d'établissements par trigger)         |
| devices                          | idem locations (sans `token_hash`, exclu par GRANT colonne) | owner/admin                                               |
| device_activation_codes          | personne                                                    | via RPC uniquement                                        |
| questionnaires/questions/options | membres (managers : leurs établissements)                   | owner/admin + manager sur ses établissements              |
| survey_sessions / survey_answers | membres (managers : leurs établissements)                   | **service uniquement** (Worker) — aucune lecture publique |
| review_links                     | membres                                                     | owner/admin + manager                                     |
| review_events                    | membres                                                     | service uniquement                                        |
| reward_campaigns                 | membres                                                     | owner/admin + manager                                     |
| reward_blocks                    | personne                                                    | service uniquement                                        |
| reward_codes                     | membres                                                     | validation via RPC `redeem_reward_code`                   |
| reward_redemptions               | membres                                                     | via RPC                                                   |
| audit_logs                       | super-admin + owner/admin (son org)                         | via fonctions uniquement                                  |

Le super-admin a un accès global en lecture (et écriture ciblée) via
`is_super_admin()` ajouté à chaque politique concernée.

## Fonctions (`0004_functions.sql`)

- `create_organization_with_owner(name, slug)` — crée l'organisation,
  l'adhésion owner et un abonnement d'essai sur le plan Essentiel.
- `create_device_activation_code(device_id)` — owner/admin ; retourne le code
  en clair une seule fois, stocke le hash, expire à 15 min.
- `activate_device(code_hash, token_hash)` — service ; usage unique, associe
  la tablette, retourne l'établissement et la configuration.
- `get_kiosk_config(device_id)` — service ; questionnaire publié + avis +
  campagne active.
- `process_survey_submission(device_id, client_session_id, started_at,
completed_at, answers jsonb)` — service ; insertion idempotente + tirage
  sécurisé de l'instant gagnant (verrou advisory par campagne).
- `redeem_reward_code(code)` — membre de l'org ; valide un code `available`
  non expiré, une seule fois.
- `add_member_by_email(org_id, email, role)` — owner/admin.
- `log_audit(...)` — interne.
- Helpers : `is_super_admin()`, `is_org_member(org_id)`,
  `has_org_role(org_id, roles)`, `can_access_location(location_id)`.

## Secrets

- Frontend : uniquement `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- Worker : `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (secrets Wrangler).
- Jamais de clé `service_role` dans le navigateur, ni dans Git.
