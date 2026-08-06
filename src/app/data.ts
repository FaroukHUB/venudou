import { supabase } from '@/lib/supabase';
import type { SessionLite } from '@/lib/stats';
import type { Device, ReviewEvent, RewardCode } from '@/lib/types';

export const SESSION_FETCH_LIMIT = 10000; // garde-fou MVP (agrégation côté client)

export interface Period {
  from: Date;
  to: Date;
}

export function periodFromPreset(preset: string): Period {
  const to = new Date();
  const from = new Date();
  switch (preset) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    default:
      from.setDate(from.getDate() - 30);
  }
  return { from, to };
}

export async function fetchSessions(orgId: string, period: Period): Promise<SessionLite[]> {
  const { data, error } = await supabase
    .from('survey_sessions')
    .select(
      'id, created_at, location_id, device_id, answers:survey_answers(question_kind, option_value, option_label, free_text)',
    )
    .eq('organization_id', orgId)
    .gte('created_at', period.from.toISOString())
    .lte('created_at', period.to.toISOString())
    .order('created_at', { ascending: false })
    .limit(SESSION_FETCH_LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SessionLite[];
}

export async function fetchReviewEvents(orgId: string, period: Period): Promise<ReviewEvent[]> {
  const { data, error } = await supabase
    .from('review_events')
    .select('*')
    .eq('organization_id', orgId)
    .gte('created_at', period.from.toISOString())
    .lte('created_at', period.to.toISOString())
    .limit(SESSION_FETCH_LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []) as ReviewEvent[];
}

export async function fetchRewardCodes(orgId: string, period: Period): Promise<RewardCode[]> {
  const { data, error } = await supabase
    .from('reward_codes')
    .select('*')
    .eq('organization_id', orgId)
    .gte('created_at', period.from.toISOString())
    .lte('created_at', period.to.toISOString())
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as RewardCode[];
}

export async function fetchDevices(orgId: string): Promise<Device[]> {
  const { data, error } = await supabase
    .from('devices')
    .select(
      'id, organization_id, location_id, name, status, activated_at, last_seen_at, created_at',
    )
    .eq('organization_id', orgId)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Device[];
}
