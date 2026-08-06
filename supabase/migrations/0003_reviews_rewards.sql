-- ============================================================
-- VenuD'où — 0003 : liens d'avis, événements d'avis, récompenses
-- ============================================================

-- ------------------------------------------------------------
-- Avis Google (par établissement)
-- ------------------------------------------------------------

create table public.review_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade unique,
  provider text not null default 'google' check (provider in ('google')),
  url text not null,
  tracking_code text not null unique, -- code court pour /r/:trackingCode
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index review_links_org_idx on public.review_links (organization_id);

create trigger review_links_updated_at before update on public.review_links
  for each row execute function public.set_updated_at();

create table public.review_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  session_id uuid references public.survey_sessions(id) on delete set null,
  event_type text not null
    check (event_type in ('prompt_shown', 'accepted', 'declined', 'qr_displayed', 'link_opened')),
  created_at timestamptz not null default now()
);

create index review_events_org_date_idx on public.review_events (organization_id, created_at desc);
create index review_events_location_date_idx on public.review_events (location_id, created_at desc);
create index review_events_type_idx on public.review_events (organization_id, event_type);

-- ------------------------------------------------------------
-- Instant gagnant
-- ------------------------------------------------------------

create table public.reward_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  reward_type text not null
    check (reward_type in ('percent', 'fixed', 'product', 'drink', 'dessert', 'custom')),
  reward_value numeric, -- % ou montant en euros selon le type
  reward_label text not null, -- libellé affiché au client
  frequency_n integer not null default 10 check (frequency_n >= 1),
  max_discount_cents integer,
  min_order_cents integer,
  validity_days integer not null default 30 check (validity_days >= 1),
  terms text not null default '',
  max_total_wins integer, -- NULL = illimité
  wins_count integer not null default 0,
  participations_count integer not null default 0,
  accepted_location_ids uuid[] not null default '{}', -- vide = établissement d'origine uniquement
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reward_campaigns_org_idx on public.reward_campaigns (organization_id);
create index reward_campaigns_location_idx on public.reward_campaigns (location_id) where is_active;

create trigger reward_campaigns_updated_at before update on public.reward_campaigns
  for each row execute function public.set_updated_at();

-- Position gagnante par bloc de N participations, tirée avec pgcrypto.
-- Jamais lisible par les clients (aucune politique SELECT en 0005).
create table public.reward_blocks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.reward_campaigns(id) on delete cascade,
  block_index integer not null,
  winning_offset integer not null,
  created_at timestamptz not null default now(),
  unique (campaign_id, block_index)
);

create table public.reward_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  campaign_id uuid not null references public.reward_campaigns(id) on delete cascade,
  session_id uuid references public.survey_sessions(id) on delete set null,
  code text not null unique,
  reward_label text not null,
  status text not null default 'available'
    check (status in ('available', 'redeemed', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_location_id uuid references public.locations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reward_codes_org_idx on public.reward_codes (organization_id, created_at desc);
create index reward_codes_campaign_idx on public.reward_codes (campaign_id);
create index reward_codes_status_idx on public.reward_codes (organization_id, status);

create trigger reward_codes_updated_at before update on public.reward_codes
  for each row execute function public.set_updated_at();

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.reward_codes(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  redeemed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index reward_redemptions_org_idx on public.reward_redemptions (organization_id, created_at desc);
