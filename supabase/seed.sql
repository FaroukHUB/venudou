-- ============================================================
-- VenuD'où — Seed de DÉVELOPPEMENT (ne pas exécuter en production telle quelle)
-- Organisation pilote : Trust Industrie (3 établissements, accès gratuit).
--
-- Prérequis : avoir créé un utilisateur via l'inscription, puis remplacer
-- :owner_user_id ci-dessous par son UUID (auth.users.id).
-- Les questionnaires par défaut sont créés automatiquement par trigger.
-- ============================================================

do $$
declare
  v_owner uuid := null; -- ← remplacer par l'UUID du propriétaire (ou laisser null)
  v_org uuid;
  v_plan uuid;
begin
  insert into public.organizations (name, slug)
  values ('Trust Industrie', 'trust-industrie')
  on conflict (slug) do nothing;

  select id into v_org from public.organizations where slug = 'trust-industrie';
  select id into v_plan from public.plans where code = 'pro';

  -- Accès gratuit, limite 3 établissements (comme accordé depuis le super-admin)
  insert into public.organization_subscriptions (organization_id, plan_id, status, max_locations_override, notes)
  values (v_org, v_plan, 'free', 3, 'Client pilote — accès gratuit accordé par le super-admin')
  on conflict (organization_id) do update
    set plan_id = excluded.plan_id, status = 'free', max_locations_override = 3;

  if v_owner is not null then
    insert into public.organization_members (organization_id, user_id, role)
    values (v_org, v_owner, 'organization_owner')
    on conflict (organization_id, user_id) do nothing;
  end if;

  insert into public.locations (organization_id, name, slug, city) values
    (v_org, 'Trust Industrie — Magasin 1', 'magasin-1', 'Paris'),
    (v_org, 'Trust Industrie — Magasin 2', 'magasin-2', 'Lyon'),
    (v_org, 'Trust Industrie — Magasin 3', 'magasin-3', 'Marseille')
  on conflict (organization_id, slug) do nothing;
end $$;

-- Pour donner le rôle super-admin à un utilisateur (clé service uniquement) :
-- insert into public.super_admins (user_id) values ('<uuid-utilisateur>');
