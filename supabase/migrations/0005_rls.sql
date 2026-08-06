-- ============================================================
-- VenuD'où — 0005 : Row Level Security sur toutes les tables
-- ============================================================
-- Principes :
--  * RLS activée partout, aucune lecture publique des réponses ;
--  * owner/admin : données de son organisation ;
--  * location_manager : données de ses établissements autorisés ;
--  * super-admin : accès global via is_super_admin() ;
--  * le Worker utilise la clé service (bypass RLS) uniquement via
--    des fonctions dédiées, jamais exposée au navigateur.

alter table public.profiles enable row level security;
alter table public.super_admins enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.member_locations enable row level security;
alter table public.plans enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.locations enable row level security;
alter table public.devices enable row level security;
alter table public.device_activation_codes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.questionnaires enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.survey_sessions enable row level security;
alter table public.survey_answers enable row level security;
alter table public.review_links enable row level security;
alter table public.review_events enable row level security;
alter table public.reward_campaigns enable row level security;
alter table public.reward_blocks enable row level security;
alter table public.reward_codes enable row level security;
alter table public.reward_redemptions enable row level security;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_super_admin());
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ------------------------------------------------------------
-- super_admins : lecture de sa propre ligne (vérification de rôle).
-- Aucune écriture possible sans clé service.
-- ------------------------------------------------------------
create policy super_admins_select_self on public.super_admins for select
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- organizations
-- ------------------------------------------------------------
create policy organizations_select on public.organizations for select
  using (public.is_org_member(id) or public.is_super_admin());
create policy organizations_update on public.organizations for update
  using (public.is_org_admin(id) or public.is_super_admin())
  with check (public.is_org_admin(id) or public.is_super_admin());
-- Création uniquement via create_organization_with_owner() (security definer).

-- ------------------------------------------------------------
-- organization_members
-- ------------------------------------------------------------
create policy organization_members_select on public.organization_members for select
  using (user_id = auth.uid() or public.is_org_member(organization_id) or public.is_super_admin());
create policy organization_members_insert on public.organization_members for insert
  with check (public.is_org_admin(organization_id) or public.is_super_admin());
create policy organization_members_update on public.organization_members for update
  using (public.is_org_admin(organization_id) or public.is_super_admin());
create policy organization_members_delete on public.organization_members for delete
  using (public.is_org_admin(organization_id) or public.is_super_admin() or user_id = auth.uid());

-- ------------------------------------------------------------
-- member_locations
-- ------------------------------------------------------------
create policy member_locations_select on public.member_locations for select
  using (exists (
    select 1 from public.organization_members m
    where m.id = member_id and (public.is_org_member(m.organization_id) or public.is_super_admin())
  ));
create policy member_locations_write on public.member_locations for all
  using (exists (
    select 1 from public.organization_members m
    where m.id = member_id and (public.is_org_admin(m.organization_id) or public.is_super_admin())
  ))
  with check (exists (
    select 1 from public.organization_members m
    where m.id = member_id and (public.is_org_admin(m.organization_id) or public.is_super_admin())
  ));

-- ------------------------------------------------------------
-- plans : tarifs publics (lecture anonyme des plans actifs),
-- édition réservée au super-admin.
-- ------------------------------------------------------------
create policy plans_select on public.plans for select
  using (is_active or public.is_super_admin());
create policy plans_write on public.plans for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ------------------------------------------------------------
-- organization_subscriptions : visibles par les membres,
-- modifiables uniquement par le super-admin (gratuité, overrides).
-- ------------------------------------------------------------
create policy organization_subscriptions_select on public.organization_subscriptions for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy organization_subscriptions_write on public.organization_subscriptions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ------------------------------------------------------------
-- locations
-- ------------------------------------------------------------
create policy locations_select on public.locations for select
  using (
    public.is_org_admin(organization_id)
    or public.can_access_location(id)
    or public.is_super_admin()
  );
create policy locations_insert on public.locations for insert
  with check (public.is_org_admin(organization_id) or public.is_super_admin());
create policy locations_update on public.locations for update
  using (public.is_org_admin(organization_id) or public.is_super_admin());
create policy locations_delete on public.locations for delete
  using (public.is_org_admin(organization_id) or public.is_super_admin());

-- ------------------------------------------------------------
-- devices : le hash du jeton n'est jamais exposé aux clients
-- (grants par colonne ci-dessous).
-- ------------------------------------------------------------
create policy devices_select on public.devices for select
  using (
    public.is_org_admin(organization_id)
    or public.can_access_location(location_id)
    or public.is_super_admin()
  );
create policy devices_insert on public.devices for insert
  with check (public.is_org_admin(organization_id) or public.can_access_location(location_id) or public.is_super_admin());
create policy devices_update on public.devices for update
  using (public.is_org_admin(organization_id) or public.can_access_location(location_id) or public.is_super_admin());
create policy devices_delete on public.devices for delete
  using (public.is_org_admin(organization_id) or public.is_super_admin());

revoke select, insert, update on public.devices from anon, authenticated;
grant select (id, organization_id, location_id, name, status, activated_at, last_seen_at, created_at, updated_at)
  on public.devices to authenticated;
grant insert (organization_id, location_id, name, status)
  on public.devices to authenticated;
grant update (name, status, location_id)
  on public.devices to authenticated;

-- ------------------------------------------------------------
-- device_activation_codes : aucune lecture/écriture directe.
-- Tout passe par les fonctions create_device_activation_code / activate_device.
-- ------------------------------------------------------------
-- (RLS activée sans aucune politique = aucun accès hors clé service.)

-- ------------------------------------------------------------
-- audit_logs : lecture super-admin + owner/admin (sa propre organisation).
-- Insertion uniquement via log_audit() (security definer).
-- ------------------------------------------------------------
create policy audit_logs_select on public.audit_logs for select
  using (
    public.is_super_admin()
    or (organization_id is not null and public.is_org_admin(organization_id))
  );

-- ------------------------------------------------------------
-- questionnaires / questions / question_options
-- ------------------------------------------------------------
create policy questionnaires_select on public.questionnaires for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy questionnaires_write on public.questionnaires for all
  using (public.is_org_admin(organization_id) or public.can_access_location(location_id) or public.is_super_admin())
  with check (public.is_org_admin(organization_id) or public.can_access_location(location_id) or public.is_super_admin());

create policy questions_select on public.questions for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy questions_write on public.questions for all
  using (
    public.is_org_admin(organization_id)
    or exists (
      select 1 from public.questionnaires qn
      where qn.id = questionnaire_id and public.can_access_location(qn.location_id)
    )
    or public.is_super_admin()
  )
  with check (
    public.is_org_admin(organization_id)
    or exists (
      select 1 from public.questionnaires qn
      where qn.id = questionnaire_id and public.can_access_location(qn.location_id)
    )
    or public.is_super_admin()
  );

create policy question_options_select on public.question_options for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy question_options_write on public.question_options for all
  using (
    public.is_org_admin(organization_id)
    or exists (
      select 1 from public.questions q
      join public.questionnaires qn on qn.id = q.questionnaire_id
      where q.id = question_id and public.can_access_location(qn.location_id)
    )
    or public.is_super_admin()
  )
  with check (
    public.is_org_admin(organization_id)
    or exists (
      select 1 from public.questions q
      join public.questionnaires qn on qn.id = q.questionnaire_id
      where q.id = question_id and public.can_access_location(qn.location_id)
    )
    or public.is_super_admin()
  );

-- ------------------------------------------------------------
-- survey_sessions / survey_answers : lecture par les membres
-- (managers : leurs établissements). AUCUNE insertion côté client :
-- seules les fonctions service (Worker) écrivent.
-- ------------------------------------------------------------
create policy survey_sessions_select on public.survey_sessions for select
  using (
    public.is_org_admin(organization_id)
    or public.can_access_location(location_id)
    or public.is_super_admin()
  );

create policy survey_answers_select on public.survey_answers for select
  using (
    public.is_org_admin(organization_id)
    or public.can_access_location(location_id)
    or public.is_super_admin()
  );

-- ------------------------------------------------------------
-- review_links / review_events
-- ------------------------------------------------------------
create policy review_links_select on public.review_links for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy review_links_update on public.review_links for update
  using (public.is_org_admin(organization_id) or public.can_access_location(location_id) or public.is_super_admin());
create policy review_links_delete on public.review_links for delete
  using (public.is_org_admin(organization_id) or public.is_super_admin());
-- Insertion via upsert_review_link() (génère le tracking_code).

create policy review_events_select on public.review_events for select
  using (
    public.is_org_admin(organization_id)
    or public.can_access_location(location_id)
    or public.is_super_admin()
  );
-- Insertion uniquement via fonctions service.

-- ------------------------------------------------------------
-- reward_campaigns / reward_codes / reward_redemptions
-- reward_blocks : aucune politique => invisible hors clé service
-- (la position gagnante n'est jamais exposée à l'avance).
-- ------------------------------------------------------------
create policy reward_campaigns_select on public.reward_campaigns for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy reward_campaigns_write on public.reward_campaigns for all
  using (public.is_org_admin(organization_id) or public.can_access_location(location_id) or public.is_super_admin())
  with check (public.is_org_admin(organization_id) or public.can_access_location(location_id) or public.is_super_admin());

create policy reward_codes_select on public.reward_codes for select
  using (
    public.is_org_admin(organization_id)
    or public.can_access_location(location_id)
    or public.is_super_admin()
  );
-- Statuts modifiés via redeem_reward_code() ; annulation par owner/admin :
create policy reward_codes_update on public.reward_codes for update
  using (public.is_org_admin(organization_id) or public.is_super_admin());

create policy reward_redemptions_select on public.reward_redemptions for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
