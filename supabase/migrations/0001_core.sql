-- ============================================================
-- VenuD'où — 0001 : extensions, identité, tenancy, offre, établissements, tablettes
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Helpers génériques
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------
-- Profils (1:1 auth.users)
-- ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Super-admins : rôle porté par une table dédiée, modifiable
-- uniquement avec la clé service (jamais depuis le navigateur).
-- ------------------------------------------------------------

create table public.super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.super_admins sa where sa.user_id = auth.uid());
$$;

-- ------------------------------------------------------------
-- Organisations et membres
-- ------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create type public.org_role as enum ('organization_owner', 'organization_admin', 'location_manager');

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'location_manager',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_idx on public.organization_members (user_id);
create index organization_members_org_idx on public.organization_members (organization_id);

create trigger organization_members_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();

-- Helpers d'accès (security definer pour éviter la récursion RLS)

create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(p_org uuid, p_roles public.org_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org and m.user_id = auth.uid() and m.role = any (p_roles)
  );
$$;

create or replace function public.is_org_admin(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_org_role(p_org, array['organization_owner','organization_admin']::public.org_role[]);
$$;

-- ------------------------------------------------------------
-- Plans et abonnements (pas de Stripe en phase 1, structure prête)
-- ------------------------------------------------------------

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  max_locations integer, -- NULL = sur mesure
  price_monthly_cents integer not null default 0,
  currency text not null default 'EUR',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

-- Données de référence (prix provisoires, éditables depuis le super-admin)
insert into public.plans (code, name, description, max_locations, price_monthly_cents, sort_order) values
  ('essentiel',   'Essentiel',   '1 établissement',            1,  2900, 1),
  ('pro',         'Pro',         'Jusqu''à 3 établissements',  3,  6900, 2),
  ('reseau',      'Réseau',      'Jusqu''à 5 établissements',  5, 10900, 3),
  ('reseau_plus', 'Réseau Plus', 'Jusqu''à 10 établissements', 10, 19900, 4),
  ('entreprise',  'Entreprise',  'Sur mesure',                 null, 0,   5)
on conflict (code) do nothing;

create table public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique,
  plan_id uuid not null references public.plans(id),
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'free', 'suspended', 'canceled')),
  trial_ends_at timestamptz,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  max_locations_override integer, -- override super-admin (limites personnalisées)
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_subscriptions_org_idx on public.organization_subscriptions (organization_id);

create trigger organization_subscriptions_updated_at before update on public.organization_subscriptions
  for each row execute function public.set_updated_at();

-- Limite effective d'établissements d'une organisation
create or replace function public.org_location_limit(p_org uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(s.max_locations_override, p.max_locations, 1)
  from public.organization_subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.organization_id = p_org;
$$;

-- ------------------------------------------------------------
-- Établissements
-- ------------------------------------------------------------

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  address_line text not null default '',
  postal_code text not null default '',
  city text not null default '',
  timezone text not null default 'Europe/Paris',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index locations_org_idx on public.locations (organization_id);

create trigger locations_updated_at before update on public.locations
  for each row execute function public.set_updated_at();

-- Blocage à l'atteinte de la limite d'établissements du plan
create or replace function public.enforce_location_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_limit integer;
  v_count integer;
begin
  v_limit := public.org_location_limit(new.organization_id);
  if v_limit is null then
    return new; -- sur mesure sans limite définie
  end if;
  select count(*) into v_count
  from public.locations l
  where l.organization_id = new.organization_id and l.status = 'active';
  if v_count >= v_limit then
    raise exception 'LOCATION_LIMIT_REACHED: limite de % établissement(s) atteinte pour cette organisation', v_limit
      using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger locations_enforce_limit before insert on public.locations
  for each row execute function public.enforce_location_limit();

-- Restriction des location_manager à certains établissements
create table public.member_locations (
  member_id uuid not null references public.organization_members(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, location_id)
);

create index member_locations_location_idx on public.member_locations (location_id);

create or replace function public.can_access_location(p_location uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.locations l
    join public.organization_members m
      on m.organization_id = l.organization_id and m.user_id = auth.uid()
    where l.id = p_location
      and (
        m.role in ('organization_owner', 'organization_admin')
        or exists (
          select 1 from public.member_locations ml
          where ml.member_id = m.id and ml.location_id = l.id
        )
      )
  );
$$;

-- ------------------------------------------------------------
-- Tablettes (devices) et codes d'activation
-- ------------------------------------------------------------

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'disabled')),
  token_hash text unique, -- SHA-256 du jeton d'appareil ; jamais le jeton en clair
  activated_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index devices_org_idx on public.devices (organization_id);
create index devices_location_idx on public.devices (location_id);

create trigger devices_updated_at before update on public.devices
  for each row execute function public.set_updated_at();

create table public.device_activation_codes (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code_hash text not null unique, -- code court haché, usage unique
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index device_activation_codes_device_idx on public.device_activation_codes (device_id);

-- ------------------------------------------------------------
-- Journaux d'audit
-- ------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text not null default 'user' check (actor_role in ('user', 'super_admin', 'system')),
  action text not null,
  target_type text not null default '',
  target_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_org_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create or replace function public.log_audit(
  p_org uuid,
  p_action text,
  p_target_type text default '',
  p_target_id text default '',
  p_metadata jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (organization_id, actor_user_id, actor_role, action, target_type, target_id, metadata)
  values (
    p_org,
    auth.uid(),
    case
      when auth.uid() is null then 'system'
      when public.is_super_admin() then 'super_admin'
      else 'user'
    end,
    p_action, p_target_type, p_target_id, p_metadata
  );
end $$;
