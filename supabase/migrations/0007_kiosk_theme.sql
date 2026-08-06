-- ============================================================
-- VenuD'où — 0007 : personnalisation visuelle du kiosque
--  * thème par questionnaire (couleur de fond, forme des boutons, logo)
--  * bucket de stockage public pour les logos des clients
--  * get_kiosk_config renvoie le thème
-- ============================================================

alter table public.questionnaires
  add column if not exists theme jsonb not null default '{}'::jsonb;

-- Bucket public pour les logos (lecture publique, écriture par les admins
-- de l'organisation ; les fichiers sont rangés par dossier <organization_id>/)
insert into storage.buckets (id, name, public)
values ('brand-logos', 'brand-logos', true)
on conflict (id) do nothing;

create policy brand_logos_read on storage.objects
  for select using (bucket_id = 'brand-logos');

create policy brand_logos_insert on storage.objects
  for insert with check (
    bucket_id = 'brand-logos'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

create policy brand_logos_update on storage.objects
  for update using (
    bucket_id = 'brand-logos'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

create policy brand_logos_delete on storage.objects
  for delete using (
    bucket_id = 'brand-logos'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

-- get_kiosk_config : ajoute le thème du questionnaire
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
      'theme', coalesce(v_questionnaire.theme, '{}'::jsonb),
      'questions', v_questions
    ),
    'review', coalesce(v_review, jsonb_build_object('active', false)),
    'rewardCampaignActive', coalesce(v_campaign_active, false)
  );
end $$;

revoke execute on function public.get_kiosk_config(text) from public, anon, authenticated;
