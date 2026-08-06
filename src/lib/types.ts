// Types du domaine VenuD'où (alignés sur supabase/migrations)

export type OrgRole = 'organization_owner' | 'organization_admin' | 'location_manager';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  max_locations: number | null;
  price_monthly_cents: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
}

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'free' | 'suspended' | 'canceled';
  trial_ends_at: string | null;
  starts_at: string;
  ends_at: string | null;
  max_locations_override: number | null;
  notes: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address_line: string;
  postal_code: string;
  city: string;
  timezone: string;
  status: 'active' | 'archived';
  created_at: string;
}

export interface Device {
  id: string;
  organization_id: string;
  location_id: string;
  name: string;
  status: 'pending' | 'active' | 'disabled';
  activated_at: string | null;
  last_seen_at: string | null;
  created_at: string;
}

export type QuestionKind = 'source' | 'gender' | 'age_range' | 'custom';

export interface Question {
  id: string;
  questionnaire_id: string;
  organization_id: string;
  kind: QuestionKind;
  label: string;
  enabled: boolean;
  required: boolean;
  allow_free_text: boolean;
  position: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  organization_id: string;
  label: string;
  value: string;
  icon: string;
  enabled: boolean;
  position: number;
  is_optout: boolean;
  is_other: boolean;
}

export interface Questionnaire {
  id: string;
  organization_id: string;
  location_id: string;
  title: string;
  is_active: boolean;
  published_at: string | null;
}

export interface SurveySession {
  id: string;
  organization_id: string;
  location_id: string;
  device_id: string | null;
  client_session_id: string;
  channel: 'kiosk';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SurveyAnswerRow {
  session_id: string;
  question_kind: QuestionKind;
  option_value: string;
  option_label: string;
  free_text: string | null;
}

export interface ReviewLink {
  id: string;
  organization_id: string;
  location_id: string;
  provider: 'google';
  url: string;
  tracking_code: string;
  is_active: boolean;
}

export type ReviewEventType =
  'prompt_shown' | 'accepted' | 'declined' | 'qr_displayed' | 'link_opened';

export interface ReviewEvent {
  id: string;
  organization_id: string;
  location_id: string;
  session_id: string | null;
  event_type: ReviewEventType;
  created_at: string;
}

export type RewardType = 'percent' | 'fixed' | 'product' | 'drink' | 'dessert' | 'custom';

export interface RewardCampaign {
  id: string;
  organization_id: string;
  location_id: string;
  name: string;
  reward_type: RewardType;
  reward_value: number | null;
  reward_label: string;
  frequency_n: number;
  max_discount_cents: number | null;
  min_order_cents: number | null;
  validity_days: number;
  terms: string;
  max_total_wins: number | null;
  wins_count: number;
  participations_count: number;
  accepted_location_ids: string[];
  is_active: boolean;
  created_at: string;
}

export interface RewardCode {
  id: string;
  organization_id: string;
  location_id: string;
  campaign_id: string;
  code: string;
  reward_label: string;
  status: 'available' | 'redeemed' | 'expired' | 'cancelled';
  expires_at: string;
  redeemed_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  actor_role: 'user' | 'super_admin' | 'system';
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// --- Kiosque : configuration renvoyée par le Worker ---

export interface KioskOption {
  id: string;
  label: string;
  value: string;
  icon: string;
  isOptout: boolean;
  isOther: boolean;
}

export interface KioskQuestion {
  id: string;
  kind: QuestionKind;
  label: string;
  required: boolean;
  allowFreeText: boolean;
  options: KioskOption[];
}

export interface KioskConfig {
  device: { id: string; name: string };
  location: { id: string; name?: string };
  organization: { id: string; name?: string };
  questionnaire: {
    id: string;
    title: string;
    publishedAt: string | null;
    questions: KioskQuestion[];
  };
  review: { active: boolean; trackingCode?: string };
  rewardCampaignActive: boolean;
}

export interface KioskAnswer {
  questionId: string;
  optionId?: string;
  freeText?: string;
}

export interface PendingKioskSession {
  clientSessionId: string;
  startedAt: string;
  completedAt: string;
  answers: KioskAnswer[];
}

export interface KioskReward {
  code: string;
  label: string;
  terms: string;
  expiresAt: string;
}
