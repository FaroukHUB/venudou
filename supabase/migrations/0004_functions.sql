-- ============================================================
-- VenuD'où — 0004 : fonctions métier (security definer)
-- ============================================================

-- Génère un code court lisible (sans caractères ambigus), aléa pgcrypto.
create or replace function public.generate_short_code(p_length integer default 8)
returns text language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_code text := '';
  i integer;
begin
  v_bytes := gen_random_bytes(p_length);
  for i in 1..p_length loop
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i - 1) % length(v_alphabet)) + 1, 1);
  end loop;
  return v_code;
end $$;

revoke execute on function public.generate_short_code(integer) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Création d'organisation (onboarding) : org + adhésion owner + essai
-- ------------------------------------------------------------

create or replace function public.create_organization_with_owner(p_name text, p_slug text)
returns uuid language plpgsql volatile security definer set search_path = public as $$
declare
  v_org uuid;
  v_plan uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if length(trim(p_name)) < 2 then
    raise exception 'INVALID_NAME';
  end if;
  if p_slug !~ '^[a-z0-9][a-z0-9-]{1,48}$' then
    raise exception 'INVALID_SLUG';
  end if;

  insert into public.organizations (name, slug) values (trim(p_name), p_slug)
  returning id into v_org;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org, auth.uid(), 'organization_owner');

  select id into v_plan from public.plans where code = 'essentiel';
  insert into public.organization_subscriptions (organization_id, plan_id, status, trial_ends_at)
  values (v_org, v_plan, 'trialing', now() + interval '14 days');

  perform public.log_audit(v_org, 'organization.created', 'organization', v_org::text,
    jsonb_build_object('name', trim(p_name)));

  return v_org;
end $$;

-- ------------------------------------------------------------
-- Tablettes : code d'activation court, temporaire, à usage unique
-- ------------------------------------------------------------

create or replace function public.create_device_activation_code(p_device uuid)
returns text language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_org uuid;
  v_location uuid;
  v_code text;
begin
  select organization_id, location_id into v_org, v_location
  from public.devices where id = p_device;
  if v_org is null then
    raise exception 'DEVICE_NOT_FOUND';
  end if;
  if not (public.is_org_admin(v_org) or public.can_access_location(v_location) or public.is_super_admin()) then
    raise exception 'FORBIDDEN';
  end if;

  -- Invalide les codes précédents de cette tablette
  update public.device_activation_codes
  set used_at = now()
  where device_id = p_device and used_at is null;

  v_code := public.generate_short_code(6);
  insert into public.device_activation_codes (device_id, organization_id, code_hash, expires_at)
  values (p_device, v_org, encode(digest(v_code, 'sha256'), 'hex'), now() + interval '15 minutes');

  perform public.log_audit(v_org, 'device.activation_code_created', 'device', p_device::text);

  -- Le code en clair n'est retourné qu'une seule fois, jamais stocké.
  return v_code;
end $$;

-- Activation par le Worker (service uniquement) : usage unique + jeton haché
create or replace function public.activate_device(p_code_hash text, p_token_hash text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_row public.device_activation_codes%rowtype;
  v_device public.devices%rowtype;
  v_location public.locations%rowtype;
  v_org public.organizations%rowtype;
begin
  select * into v_row
  from public.device_activation_codes
  where code_hash = p_code_hash
  for update;

  if v_row.id is null or v_row.used_at is not null or v_row.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'INVALID_OR_EXPIRED_CODE');
  end if;

  update public.device_activation_codes set used_at = now() where id = v_row.id;

  update public.devices
  set token_hash = p_token_hash, status = 'active', activated_at = now(), last_seen_at = now()
  where id = v_row.device_id
  returning * into v_device;

  select * into v_location from public.locations where id = v_device.location_id;
  select * into v_org from public.organizations where id = v_device.organization_id;

  if v_org.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'ORGANIZATION_SUSPENDED');
  end if;

  perform public.log_audit(v_org.id, 'device.activated', 'device', v_device.id::text);

  return jsonb_build_object(
    'ok', true,
    'device', jsonb_build_object('id', v_device.id, 'name', v_device.name),
    'location', jsonb_build_object('id', v_location.id, 'name', v_location.name),
    'organization', jsonb_build_object('id', v_org.id, 'name', v_org.name)
  );
end $$;

revoke execute on function public.activate_device(text, text) from public, anon, authenticated;

-- Configuration du kiosque pour une tablette identifiée par son jeton haché
create or replace function public.get_kiosk_config(p_token_hash text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_device public.devices%rowtype;
  v_questionnaire public.questionnaires%rowtype;
  v_questions jsonb;
  v_review jsonb;
  v_campaign_active boolean;
begin
  select * into v_device
  from public.devices
  where token_hash = p_token_hash and status = 'active';
  if v_device.id is null then
    return jsonb_build_object('ok', false, 'error', 'DEVICE_NOT_FOUND');
  end if;

  if not exists (
    select 1 from public.organizations o
    where o.id = v_device.organization_id and o.status = 'active'
  ) then
    return jsonb_build_object('ok', false, 'error', 'ORGANIZATION_SUSPENDED');
  end if;

  update public.devices set last_seen_at = now() where id = v_device.id;

  select * into v_questionnaire
  from public.questionnaires
  where location_id = v_device.location_id and is_active;

  select coalesce(jsonb_agg(q order by q_position), '[]'::jsonb) into v_questions
  from (
    select q.position as q_position, jsonb_build_object(
      'id', q.id,
      'kind', q.kind,
      'label', q.label,
      'required', q.required,
      'allowFreeText', q.allow_free_text,
      'options', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', o.id, 'label', o.label, 'value', o.value, 'icon', o.icon,
          'isOptout', o.is_optout, 'isOther', o.is_other
        ) order by o.position), '[]'::jsonb)
        from public.question_options o
        where o.question_id = q.id and o.enabled
      )
    ) as q
    from public.questions q
    where q.questionnaire_id = v_questionnaire.id and q.enabled
  ) sub;

  select jsonb_build_object('active', rl.is_active, 'trackingCode', rl.tracking_code)
  into v_review
  from public.review_links rl
  where rl.location_id = v_device.location_id and rl.is_active;

  select exists (
    select 1 from public.reward_campaigns c
    where c.location_id = v_device.location_id and c.is_active
      and (c.max_total_wins is null or c.wins_count < c.max_total_wins)
  ) into v_campaign_active;

  return jsonb_build_object(
    'ok', true,
    'device', jsonb_build_object('id', v_device.id, 'name', v_device.name),
    'location', jsonb_build_object('id', v_device.location_id),
    'organization', jsonb_build_object('id', v_device.organization_id),
    'questionnaire', jsonb_build_object(
      'id', v_questionnaire.id,
      'title', v_questionnaire.title,
      'publishedAt', v_questionnaire.published_at,
      'questions', v_questions
    ),
    'review', coalesce(v_review, jsonb_build_object('active', false)),
    'rewardCampaignActive', coalesce(v_campaign_active, false)
  );
end $$;

revoke execute on function public.get_kiosk_config(text) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Soumission d'une session (Worker) : idempotente + tirage sécurisé
-- ------------------------------------------------------------

create or replace function public.process_survey_submission(
  p_token_hash text,
  p_client_session_id uuid,
  p_started_at timestamptz,
  p_completed_at timestamptz,
  p_answers jsonb -- [{questionId, optionId?, freeText?}]
) returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_device public.devices%rowtype;
  v_questionnaire_id uuid;
  v_session_id uuid;
  v_answer jsonb;
  v_question public.questions%rowtype;
  v_option public.question_options%rowtype;
  v_campaign public.reward_campaigns%rowtype;
  v_block_index integer;
  v_offset integer;
  v_winning integer;
  v_code text;
  v_reward jsonb := null;
  v_expires timestamptz;
begin
  select * into v_device
  from public.devices
  where token_hash = p_token_hash and status = 'active';
  if v_device.id is null then
    return jsonb_build_object('ok', false, 'error', 'DEVICE_NOT_FOUND');
  end if;

  select id into v_questionnaire_id
  from public.questionnaires where location_id = v_device.location_id and is_active;

  -- Idempotence : un renvoi hors ligne du même client_session_id est ignoré.
  insert into public.survey_sessions
    (organization_id, location_id, device_id, questionnaire_id, client_session_id, channel, started_at, completed_at)
  values
    (v_device.organization_id, v_device.location_id, v_device.id, v_questionnaire_id,
     p_client_session_id, 'kiosk', p_started_at, p_completed_at)
  on conflict (client_session_id) do nothing
  returning id into v_session_id;

  if v_session_id is null then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  update public.devices set last_seen_at = now() where id = v_device.id;

  -- Réponses : chaque option doit appartenir au questionnaire de la tablette.
  for v_answer in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) loop
    select q.* into v_question
    from public.questions q
    where q.id = (v_answer ->> 'questionId')::uuid
      and q.questionnaire_id = v_questionnaire_id;
    if v_question.id is null then
      continue;
    end if;

    v_option := null;
    if v_answer ? 'optionId' and (v_answer ->> 'optionId') is not null then
      select o.* into v_option
      from public.question_options o
      where o.id = (v_answer ->> 'optionId')::uuid and o.question_id = v_question.id;
      if v_option.id is null then
        continue;
      end if;
    end if;

    insert into public.survey_answers
      (session_id, organization_id, location_id, question_id, option_id, free_text,
       question_kind, option_value, option_label)
    values
      (v_session_id, v_device.organization_id, v_device.location_id, v_question.id, v_option.id,
       nullif(left(coalesce(v_answer ->> 'freeText', ''), 200), ''),
       v_question.kind, coalesce(v_option.value, ''), coalesce(v_option.label, ''));
  end loop;

  -- Instant gagnant : tirage par bloc de N participations, verrou par campagne.
  select * into v_campaign
  from public.reward_campaigns c
  where c.location_id = v_device.location_id and c.is_active
    and (c.max_total_wins is null or c.wins_count < c.max_total_wins)
  order by c.created_at
  limit 1
  for update;

  if v_campaign.id is not null then
    v_offset := v_campaign.participations_count % v_campaign.frequency_n;
    v_block_index := v_campaign.participations_count / v_campaign.frequency_n;

    -- Position gagnante du bloc, tirée en aléa cryptographique au premier passage.
    insert into public.reward_blocks (campaign_id, block_index, winning_offset)
    values (
      v_campaign.id, v_block_index,
      (get_byte(gen_random_bytes(4), 0) * 16777216
       + get_byte(gen_random_bytes(4), 1) * 65536
       + get_byte(gen_random_bytes(4), 2) * 256
       + get_byte(gen_random_bytes(4), 3)) % v_campaign.frequency_n
    )
    on conflict (campaign_id, block_index) do nothing;

    select winning_offset into v_winning
    from public.reward_blocks
    where campaign_id = v_campaign.id and block_index = v_block_index;

    update public.reward_campaigns
    set participations_count = participations_count + 1
    where id = v_campaign.id;

    if v_offset = v_winning then
      v_code := public.generate_short_code(8);
      v_expires := now() + make_interval(days => v_campaign.validity_days);

      insert into public.reward_codes
        (organization_id, location_id, campaign_id, session_id, code, reward_label, expires_at)
      values
        (v_campaign.organization_id, v_campaign.location_id, v_campaign.id, v_session_id,
         v_code, v_campaign.reward_label, v_expires);

      update public.reward_campaigns set wins_count = wins_count + 1 where id = v_campaign.id;

      v_reward := jsonb_build_object(
        'code', v_code,
        'label', v_campaign.reward_label,
        'terms', v_campaign.terms,
        'expiresAt', v_expires
      );
    end if;
  end if;

  return jsonb_build_object('ok', true, 'duplicate', false, 'sessionId', v_session_id, 'reward', v_reward);
end $$;

revoke execute on function public.process_survey_submission(text, uuid, timestamptz, timestamptz, jsonb)
  from public, anon, authenticated;

-- ------------------------------------------------------------
-- Événements d'avis émis par le kiosque (service uniquement)
-- ------------------------------------------------------------

create or replace function public.record_review_event(
  p_token_hash text,
  p_event_type text,
  p_client_session_id uuid default null
) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_device public.devices%rowtype;
  v_session_id uuid;
begin
  select * into v_device from public.devices where token_hash = p_token_hash and status = 'active';
  if v_device.id is null then
    return jsonb_build_object('ok', false, 'error', 'DEVICE_NOT_FOUND');
  end if;
  if p_client_session_id is not null then
    select id into v_session_id from public.survey_sessions where client_session_id = p_client_session_id;
  end if;
  insert into public.review_events (organization_id, location_id, session_id, event_type)
  values (v_device.organization_id, v_device.location_id, v_session_id, p_event_type);
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.record_review_event(text, text, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Validation d'un code de gain par le commerçant
-- ------------------------------------------------------------

create or replace function public.redeem_reward_code(p_code text, p_location uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_row public.reward_codes%rowtype;
  v_campaign public.reward_campaigns%rowtype;
begin
  select * into v_row from public.reward_codes where code = upper(trim(p_code)) for update;
  if v_row.id is null then
    return jsonb_build_object('ok', false, 'error', 'CODE_NOT_FOUND');
  end if;
  if not (public.is_org_member(v_row.organization_id)) then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  if v_row.status = 'redeemed' then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_REDEEMED', 'redeemedAt', v_row.redeemed_at);
  end if;
  if v_row.status <> 'available' then
    return jsonb_build_object('ok', false, 'error', 'CODE_' || upper(v_row.status));
  end if;
  if v_row.expires_at < now() then
    update public.reward_codes set status = 'expired' where id = v_row.id;
    return jsonb_build_object('ok', false, 'error', 'CODE_EXPIRED');
  end if;

  select * into v_campaign from public.reward_campaigns where id = v_row.campaign_id;
  if p_location is not null
     and p_location <> v_row.location_id
     and not (p_location = any (v_campaign.accepted_location_ids)) then
    return jsonb_build_object('ok', false, 'error', 'LOCATION_NOT_ACCEPTED');
  end if;

  update public.reward_codes
  set status = 'redeemed', redeemed_at = now(), redeemed_by = auth.uid(),
      redeemed_location_id = coalesce(p_location, v_row.location_id)
  where id = v_row.id;

  insert into public.reward_redemptions (code_id, organization_id, location_id, redeemed_by)
  values (v_row.id, v_row.organization_id, coalesce(p_location, v_row.location_id), auth.uid());

  perform public.log_audit(v_row.organization_id, 'reward.redeemed', 'reward_code', v_row.id::text,
    jsonb_build_object('code', v_row.code));

  return jsonb_build_object('ok', true, 'label', v_row.reward_label, 'expiresAt', v_row.expires_at);
end $$;

-- ------------------------------------------------------------
-- Équipe : ajout d'un membre par e-mail (compte existant)
-- ------------------------------------------------------------

create or replace function public.add_member_by_email(p_org uuid, p_email text, p_role public.org_role)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid;
begin
  if not (public.is_org_admin(p_org) or public.is_super_admin()) then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'USER_NOT_FOUND');
  end if;
  insert into public.organization_members (organization_id, user_id, role)
  values (p_org, v_user, p_role)
  on conflict (organization_id, user_id) do update set role = excluded.role;

  perform public.log_audit(p_org, 'member.added', 'user', v_user::text,
    jsonb_build_object('role', p_role));
  return jsonb_build_object('ok', true);
end $$;

-- ------------------------------------------------------------
-- Lien d'avis : génération du tracking code côté client impossible,
-- on la fait ici (owner/admin/manager de l'établissement).
-- ------------------------------------------------------------

create or replace function public.upsert_review_link(p_location uuid, p_url text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_org uuid;
  v_code text;
begin
  select organization_id into v_org from public.locations where id = p_location;
  if v_org is null then
    return jsonb_build_object('ok', false, 'error', 'LOCATION_NOT_FOUND');
  end if;
  if not (public.is_org_admin(v_org) or public.can_access_location(p_location)) then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  if p_url !~ '^https://' then
    return jsonb_build_object('ok', false, 'error', 'INVALID_URL');
  end if;

  v_code := lower(public.generate_short_code(8));
  insert into public.review_links (organization_id, location_id, url, tracking_code)
  values (v_org, p_location, p_url, v_code)
  on conflict (location_id) do update set url = excluded.url, is_active = true;

  return (
    select jsonb_build_object('ok', true, 'trackingCode', rl.tracking_code, 'url', rl.url)
    from public.review_links rl where rl.location_id = p_location
  );
end $$;

-- Résolution + journalisation d'un clic /r/:code (Worker, service uniquement)
create or replace function public.resolve_review_redirect(p_tracking_code text, p_client_session_id uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_link public.review_links%rowtype;
  v_session_id uuid;
begin
  select * into v_link from public.review_links
  where tracking_code = lower(trim(p_tracking_code)) and is_active;
  if v_link.id is null then
    return jsonb_build_object('ok', false, 'error', 'LINK_NOT_FOUND');
  end if;
  if p_client_session_id is not null then
    select id into v_session_id from public.survey_sessions where client_session_id = p_client_session_id;
  end if;
  insert into public.review_events (organization_id, location_id, session_id, event_type)
  values (v_link.organization_id, v_link.location_id, v_session_id, 'link_opened');
  return jsonb_build_object('ok', true, 'url', v_link.url);
end $$;

revoke execute on function public.resolve_review_redirect(text, uuid) from public, anon, authenticated;
