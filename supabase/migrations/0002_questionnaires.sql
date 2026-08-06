-- ============================================================
-- VenuD'où — 0002 : questionnaires, questions, options, sessions, réponses
-- ============================================================

create table public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade unique,
  title text not null default 'Questionnaire d''accueil',
  is_active boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index questionnaires_org_idx on public.questionnaires (organization_id);

create trigger questionnaires_updated_at before update on public.questionnaires
  for each row execute function public.set_updated_at();

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('source', 'gender', 'age_range', 'custom')),
  label text not null,
  enabled boolean not null default true,
  required boolean not null default false,
  allow_free_text boolean not null default false, -- champ « précisez » (Autre), jamais obligatoire
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index questions_questionnaire_idx on public.questions (questionnaire_id, position);
create index questions_org_idx on public.questions (organization_id);

create trigger questions_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  label text not null,
  value text not null, -- identifiant stable pour les statistiques
  icon text not null default '', -- nom d'icône Lucide
  enabled boolean not null default true,
  position integer not null default 0,
  is_optout boolean not null default false, -- « Je préfère ne pas répondre »
  is_other boolean not null default false,  -- « Autre » (ouvre le champ facultatif)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index question_options_question_idx on public.question_options (question_id, position);
create index question_options_org_idx on public.question_options (organization_id);

create trigger question_options_updated_at before update on public.question_options
  for each row execute function public.set_updated_at();

-- Garde-fou : impossible de désactiver/supprimer l'option de refus
-- de la question « genre » tant que la question est active.
create or replace function public.protect_gender_optout()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_kind text;
  v_enabled boolean;
begin
  select q.kind, q.enabled into v_kind, v_enabled
  from public.questions q
  where q.id = coalesce(old.question_id, new.question_id);

  if v_kind = 'gender' and coalesce(v_enabled, false) and coalesce(old.is_optout, new.is_optout) then
    if tg_op = 'DELETE' then
      raise exception 'GENDER_OPTOUT_PROTECTED: l''option de refus ne peut pas être supprimée quand la question genre est active';
    elsif tg_op = 'UPDATE' and new.enabled = false then
      raise exception 'GENDER_OPTOUT_PROTECTED: l''option de refus ne peut pas être désactivée quand la question genre est active';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

create trigger question_options_protect_optout
  before update or delete on public.question_options
  for each row execute function public.protect_gender_optout();

-- ------------------------------------------------------------
-- Configuration par défaut d'un nouvel établissement
-- ------------------------------------------------------------

create or replace function public.create_default_questionnaire(p_location uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_questionnaire uuid;
  v_question uuid;
begin
  select organization_id into v_org from public.locations where id = p_location;
  if v_org is null then
    raise exception 'LOCATION_NOT_FOUND';
  end if;

  insert into public.questionnaires (organization_id, location_id, published_at)
  values (v_org, p_location, now())
  returning id into v_questionnaire;

  -- Étape 1 — provenance
  insert into public.questions (questionnaire_id, organization_id, kind, label, enabled, required, allow_free_text, position)
  values (v_questionnaire, v_org, 'source', 'Comment avez-vous connu notre établissement ?', true, true, false, 1)
  returning id into v_question;

  insert into public.question_options (question_id, organization_id, label, value, icon, position, is_other) values
    (v_question, v_org, 'Facebook',        'facebook',       'Facebook',      1, false),
    (v_question, v_org, 'Instagram',       'instagram',      'Instagram',     2, false),
    (v_question, v_org, 'Snapchat',        'snapchat',       'Ghost',         3, false),
    (v_question, v_org, 'TikTok',          'tiktok',         'Music2',        4, false),
    (v_question, v_org, 'Google',          'google',         'Search',        5, false),
    (v_question, v_org, 'Bouche-à-oreille','word_of_mouth',  'MessagesSquare',6, false),
    (v_question, v_org, 'Autre',           'other',          'MoreHorizontal',7, true);

  -- Champ de précision facultatif pour « Autre »
  update public.questions set allow_free_text = true where id = v_question;

  -- Étape 2 — genre
  insert into public.questions (questionnaire_id, organization_id, kind, label, enabled, required, position)
  values (v_questionnaire, v_org, 'gender', 'Vous êtes…', true, false, 2)
  returning id into v_question;

  insert into public.question_options (question_id, organization_id, label, value, icon, position, is_optout) values
    (v_question, v_org, 'Homme', 'male',   'User',    1, false),
    (v_question, v_org, 'Femme', 'female', 'User',    2, false),
    (v_question, v_org, 'Je préfère ne pas répondre', 'no_answer', 'EyeOff', 3, true);

  -- Étape 3 — tranche d'âge
  insert into public.questions (questionnaire_id, organization_id, kind, label, enabled, required, position)
  values (v_questionnaire, v_org, 'age_range', 'Quel âge avez-vous ?', true, false, 3)
  returning id into v_question;

  insert into public.question_options (question_id, organization_id, label, value, icon, position, is_optout) values
    (v_question, v_org, 'Moins de 18 ans', 'under_18', '', 1, false),
    (v_question, v_org, '18–24 ans',       '18_24',    '', 2, false),
    (v_question, v_org, '25–34 ans',       '25_34',    '', 3, false),
    (v_question, v_org, '35–44 ans',       '35_44',    '', 4, false),
    (v_question, v_org, '45–54 ans',       '45_54',    '', 5, false),
    (v_question, v_org, '55 ans et plus',  '55_plus',  '', 6, false),
    (v_question, v_org, 'Je préfère ne pas répondre', 'no_answer', 'EyeOff', 7, true);

  return v_questionnaire;
end $$;

-- Chaque nouvel établissement reçoit automatiquement sa configuration par défaut
create or replace function public.on_location_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.create_default_questionnaire(new.id);
  return new;
end $$;

create trigger locations_create_default_questionnaire
  after insert on public.locations
  for each row execute function public.on_location_created();

-- ------------------------------------------------------------
-- Sessions de réponse (anonymes) et réponses
-- ------------------------------------------------------------

create table public.survey_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  questionnaire_id uuid references public.questionnaires(id) on delete set null,
  client_session_id uuid not null unique, -- idempotence de la synchro hors ligne
  channel text not null default 'kiosk' check (channel in ('kiosk')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(), -- heure serveur
  updated_at timestamptz not null default now()
);

create index survey_sessions_org_date_idx on public.survey_sessions (organization_id, created_at desc);
create index survey_sessions_location_date_idx on public.survey_sessions (location_id, created_at desc);
create index survey_sessions_device_idx on public.survey_sessions (device_id, created_at desc);

create trigger survey_sessions_updated_at before update on public.survey_sessions
  for each row execute function public.set_updated_at();

create table public.survey_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.survey_sessions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  option_id uuid references public.question_options(id) on delete set null,
  free_text text,
  -- dénormalisation pour des statistiques rapides et stables dans le temps
  question_kind text not null,
  option_value text not null default '',
  option_label text not null default '',
  created_at timestamptz not null default now()
);

create index survey_answers_session_idx on public.survey_answers (session_id);
create index survey_answers_org_date_idx on public.survey_answers (organization_id, created_at desc);
create index survey_answers_location_date_idx on public.survey_answers (location_id, created_at desc);
create index survey_answers_question_option_idx on public.survey_answers (question_id, option_id);
create index survey_answers_kind_value_idx on public.survey_answers (organization_id, question_kind, option_value);
