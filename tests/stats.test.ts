import { describe, expect, it } from 'vitest';
import {
  applyFilters,
  countByDay,
  countByKind,
  crossTab,
  heatmapDayHour,
  optionalAnswerRate,
  type SessionLite,
} from '@/lib/stats';

function session(
  id: string,
  createdAt: string,
  locationId: string,
  answers: [string, string, string][],
): SessionLite {
  return {
    id,
    created_at: createdAt,
    location_id: locationId,
    device_id: 'device-1',
    answers: answers.map(([kind, value, label]) => ({
      question_kind: kind,
      option_value: value,
      option_label: label,
    })),
  };
}

const sessions: SessionLite[] = [
  session('1', '2026-08-03T10:15:00Z', 'loc-a', [
    ['source', 'instagram', 'Instagram'],
    ['gender', 'female', 'Femme'],
    ['age_range', '25_34', '25–34 ans'],
  ]),
  session('2', '2026-08-03T12:30:00Z', 'loc-a', [
    ['source', 'instagram', 'Instagram'],
    ['gender', 'male', 'Homme'],
  ]),
  session('3', '2026-08-04T18:00:00Z', 'loc-b', [
    ['source', 'word_of_mouth', 'Bouche-à-oreille'],
    ['gender', 'no_answer', 'Je préfère ne pas répondre'],
    ['age_range', '45_54', '45–54 ans'],
  ]),
];

describe('agrégations statistiques', () => {
  it('countByKind trie par volume décroissant', () => {
    const rows = countByKind(sessions, 'source');
    expect(rows[0]).toMatchObject({ value: 'instagram', count: 2 });
    expect(rows[1]).toMatchObject({ value: 'word_of_mouth', count: 1 });
  });

  it('countByDay groupe par jour', () => {
    const rows = countByDay(sessions);
    expect(rows).toHaveLength(2);
    expect(rows[0].count + rows[1].count).toBe(3);
  });

  it('crossTab croise provenance et genre', () => {
    const rows = crossTab(sessions, 'source', 'gender');
    const instagram = rows.find((r) => r.a === 'instagram')!;
    expect(instagram.byB).toEqual({ female: 1, male: 1 });
  });

  it('applyFilters filtre par établissement et par provenance', () => {
    expect(applyFilters(sessions, { locationId: 'loc-a' })).toHaveLength(2);
    expect(applyFilters(sessions, { source: 'word_of_mouth' })).toHaveLength(1);
    expect(applyFilters(sessions, { locationId: 'loc-a', gender: 'male' })).toHaveLength(1);
  });

  it('optionalAnswerRate exclut les refus de réponse', () => {
    // 3 sessions : 2 réponses genre réelles + 1 refus → 2/3
    expect(optionalAnswerRate(sessions, 'gender')).toBeCloseTo(2 / 3);
    // âge : 2 réponses sur 3 sessions
    expect(optionalAnswerRate(sessions, 'age_range')).toBeCloseTo(2 / 3);
  });

  it('heatmapDayHour produit une grille 7×24 cohérente', () => {
    const grid = heatmapDayHour(sessions);
    expect(grid).toHaveLength(7);
    expect(grid.every((row) => row.length === 24)).toBe(true);
    expect(grid.flat().reduce((a, b) => a + b, 0)).toBe(3);
  });
});
