// Agrégations statistiques pures (testées dans tests/stats.test.ts).
// Les sessions sont récupérées filtrées/indexées côté Supabase puis agrégées ici.

import type { QuestionKind } from './types';

export interface AnswerLite {
  question_kind: QuestionKind | string;
  option_value: string;
  option_label: string;
  free_text?: string | null;
}

export interface SessionLite {
  id: string;
  created_at: string;
  location_id: string;
  device_id: string | null;
  answers: AnswerLite[];
}

export function answerOf(session: SessionLite, kind: string): AnswerLite | undefined {
  return session.answers.find((a) => a.question_kind === kind);
}

export interface StatFilters {
  source?: string;
  gender?: string;
  ageRange?: string;
  locationId?: string;
  deviceId?: string;
}

export function applyFilters(sessions: SessionLite[], f: StatFilters): SessionLite[] {
  return sessions.filter((s) => {
    if (f.locationId && s.location_id !== f.locationId) return false;
    if (f.deviceId && s.device_id !== f.deviceId) return false;
    if (f.source && answerOf(s, 'source')?.option_value !== f.source) return false;
    if (f.gender && answerOf(s, 'gender')?.option_value !== f.gender) return false;
    if (f.ageRange && answerOf(s, 'age_range')?.option_value !== f.ageRange) return false;
    return true;
  });
}

export interface CountRow {
  value: string;
  label: string;
  count: number;
}

/** Répartition des réponses pour une question (provenance, genre, âge…). */
export function countByKind(sessions: SessionLite[], kind: string): CountRow[] {
  const map = new Map<string, CountRow>();
  for (const s of sessions) {
    const a = answerOf(s, kind);
    if (!a || !a.option_value) continue;
    const row = map.get(a.option_value) ?? { value: a.option_value, label: a.option_label, count: 0 };
    row.count += 1;
    map.set(a.option_value, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Évolution du volume par jour (clé AAAA-MM-JJ, en heure locale). */
export function countByDay(sessions: SessionLite[]): { day: string; count: number }[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const d = new Date(s.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/** Croisement kindA × kindB (ex. provenance × genre). */
export function crossTab(
  sessions: SessionLite[],
  kindA: string,
  kindB: string,
): { a: string; aLabel: string; byB: Record<string, number> }[] {
  const map = new Map<string, { a: string; aLabel: string; byB: Record<string, number> }>();
  for (const s of sessions) {
    const ansA = answerOf(s, kindA);
    const ansB = answerOf(s, kindB);
    if (!ansA?.option_value || !ansB?.option_value) continue;
    const row = map.get(ansA.option_value) ?? { a: ansA.option_value, aLabel: ansA.option_label, byB: {} };
    row.byB[ansB.option_value] = (row.byB[ansB.option_value] ?? 0) + 1;
    map.set(ansA.option_value, row);
  }
  return [...map.values()].sort(
    (x, y) =>
      Object.values(y.byB).reduce((s, n) => s + n, 0) -
      Object.values(x.byB).reduce((s, n) => s + n, 0),
  );
}

/** Volume par établissement. */
export function countByLocation(sessions: SessionLite[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    map.set(s.location_id, (map.get(s.location_id) ?? 0) + 1);
  }
  return map;
}

/** Grille jour de semaine (0 = lundi) × heure. */
export function heatmapDayHour(sessions: SessionLite[]): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const s of sessions) {
    const d = new Date(s.created_at);
    const weekday = (d.getDay() + 6) % 7; // lundi = 0
    grid[weekday][d.getHours()] += 1;
  }
  return grid;
}

/** Taux de réponse aux questions facultatives (ex. genre, âge). */
export function optionalAnswerRate(sessions: SessionLite[], kind: string): number {
  if (sessions.length === 0) return 0;
  let answered = 0;
  for (const s of sessions) {
    const a = answerOf(s, kind);
    if (a && a.option_value && a.option_value !== 'no_answer') answered += 1;
  }
  return answered / sessions.length;
}
