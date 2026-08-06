-- ============================================================
-- VenuD'où — 0006 : correctif pgcrypto sur Supabase
-- Sur Supabase, pgcrypto est installée dans le schéma `extensions`.
-- Les fonctions qui utilisent digest() / gen_random_bytes() doivent donc
-- inclure `extensions` dans leur search_path.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

alter function public.generate_short_code(integer)
  set search_path = public, extensions;

alter function public.create_device_activation_code(uuid)
  set search_path = public, extensions;

alter function public.process_survey_submission(text, uuid, timestamptz, timestamptz, jsonb)
  set search_path = public, extensions;
