-- ============================================================
-- VenuD'où — Vérifications SQL à exécuter sur une base de test
-- (jamais en production). Complètent les tests Vitest/Playwright
-- pour les scénarios qui dépendent de PostgreSQL et de la RLS.
--
-- Usage : base locale `supabase start` + migrations appliquées,
-- puis coller ce fichier dans le SQL Editor / psql.
-- Chaque bloc lève une exception si la garantie est violée.
-- ============================================================

-- 1. La limite d'établissements est appliquée par trigger
do $$
declare
  v_org uuid;
  v_plan uuid;
  v_failed boolean := false;
begin
  insert into public.organizations (name, slug) values ('Org Test Limite', 'org-test-limite')
  returning id into v_org;
  select id into v_plan from public.plans where code = 'essentiel'; -- 1 établissement
  insert into public.organization_subscriptions (organization_id, plan_id, status)
  values (v_org, v_plan, 'active');

  insert into public.locations (organization_id, name, slug) values (v_org, 'L1', 'l1');
  begin
    insert into public.locations (organization_id, name, slug) values (v_org, 'L2', 'l2');
  exception when others then
    v_failed := true; -- attendu : LOCATION_LIMIT_REACHED
  end;
  if not v_failed then
    raise exception 'ECHEC : la limite d''établissements n''a pas bloqué la 2e insertion';
  end if;
  raise notice 'OK : limite d''établissements appliquée';
  delete from public.organizations where id = v_org;
end $$;

-- 2. Le questionnaire par défaut est créé automatiquement
do $$
declare
  v_org uuid;
  v_plan uuid;
  v_loc uuid;
  v_count integer;
begin
  insert into public.organizations (name, slug) values ('Org Test Q', 'org-test-q')
  returning id into v_org;
  select id into v_plan from public.plans where code = 'pro';
  insert into public.organization_subscriptions (organization_id, plan_id, status)
  values (v_org, v_plan, 'active');
  insert into public.locations (organization_id, name, slug) values (v_org, 'L1', 'l1')
  returning id into v_loc;

  select count(*) into v_count
  from public.questions q
  join public.questionnaires qn on qn.id = q.questionnaire_id
  where qn.location_id = v_loc;
  if v_count <> 3 then
    raise exception 'ECHEC : % questions par défaut au lieu de 3', v_count;
  end if;
  raise notice 'OK : questionnaire par défaut (provenance, genre, âge)';
  delete from public.organizations where id = v_org;
end $$;

-- 3. Un code d'activation est à usage unique
do $$
declare
  v_org uuid;
  v_plan uuid;
  v_loc uuid;
  v_device uuid;
  v_hash text := encode(digest('CODE01', 'sha256'), 'hex');
  r1 jsonb;
  r2 jsonb;
begin
  insert into public.organizations (name, slug) values ('Org Test Act', 'org-test-act')
  returning id into v_org;
  select id into v_plan from public.plans where code = 'pro';
  insert into public.organization_subscriptions (organization_id, plan_id, status)
  values (v_org, v_plan, 'active');
  insert into public.locations (organization_id, name, slug) values (v_org, 'L1', 'l1')
  returning id into v_loc;
  insert into public.devices (organization_id, location_id, name) values (v_org, v_loc, 'T1')
  returning id into v_device;
  insert into public.device_activation_codes (device_id, organization_id, code_hash, expires_at)
  values (v_device, v_org, v_hash, now() + interval '15 minutes');

  r1 := public.activate_device(v_hash, encode(digest('token-1', 'sha256'), 'hex'));
  r2 := public.activate_device(v_hash, encode(digest('token-2', 'sha256'), 'hex'));
  if not (r1 ->> 'ok')::boolean then
    raise exception 'ECHEC : la première activation aurait dû réussir (%)', r1;
  end if;
  if (r2 ->> 'ok')::boolean then
    raise exception 'ECHEC : le code d''activation a été réutilisé';
  end if;
  raise notice 'OK : code d''activation à usage unique';
  delete from public.organizations where id = v_org;
end $$;

-- 4. Soumission idempotente + instant gagnant garanti avec N=1
do $$
declare
  v_org uuid; v_plan uuid; v_loc uuid; v_device uuid;
  v_token text := encode(digest('token-kiosk', 'sha256'), 'hex');
  v_session uuid := gen_random_uuid();
  r jsonb; r_dup jsonb;
begin
  insert into public.organizations (name, slug) values ('Org Test S', 'org-test-s')
  returning id into v_org;
  select id into v_plan from public.plans where code = 'pro';
  insert into public.organization_subscriptions (organization_id, plan_id, status)
  values (v_org, v_plan, 'active');
  insert into public.locations (organization_id, name, slug) values (v_org, 'L1', 'l1')
  returning id into v_loc;
  insert into public.devices (organization_id, location_id, name, status, token_hash)
  values (v_org, v_loc, 'T1', 'active', v_token)
  returning id into v_device;
  insert into public.reward_campaigns
    (organization_id, location_id, name, reward_type, reward_label, frequency_n, validity_days)
  values (v_org, v_loc, 'Test', 'drink', 'Une boisson offerte', 1, 30);

  r := public.process_survey_submission(v_token, v_session, now(), now(), '[]'::jsonb);
  if r -> 'reward' is null or r -> 'reward' = 'null'::jsonb then
    raise exception 'ECHEC : avec N=1, chaque participation doit gagner (%)', r;
  end if;
  r_dup := public.process_survey_submission(v_token, v_session, now(), now(), '[]'::jsonb);
  if not (r_dup ->> 'duplicate')::boolean then
    raise exception 'ECHEC : le renvoi du même client_session_id doit être ignoré';
  end if;
  raise notice 'OK : soumission idempotente + tirage N=1';

  -- 5. Un gain ne peut pas être validé deux fois (via update direct service)
  declare
    v_code text;
  begin
    select code into v_code from public.reward_codes where organization_id = v_org limit 1;
    update public.reward_codes set status = 'redeemed', redeemed_at = now() where code = v_code;
    r := public.redeem_reward_code(v_code, null);
    if (r ->> 'ok')::boolean then
      raise exception 'ECHEC : un code déjà utilisé a été revalidé';
    end if;
    raise notice 'OK : un gain n''est utilisable qu''une seule fois';
  end;
  delete from public.organizations where id = v_org;
end $$;

-- 6. Isolation RLS entre deux organisations (à exécuter avec des JWT réels)
-- Ce contrôle nécessite deux utilisateurs authentifiés ; avec la CLI :
--   select set_config('request.jwt.claims', '{"sub":"<user-A>","role":"authenticated"}', true);
--   set local role authenticated;
--   select count(*) from public.survey_sessions; -- ne doit voir que l'org de A
-- Répéter avec l'utilisateur B et vérifier qu'aucune ligne de l'org A n'apparaît.
