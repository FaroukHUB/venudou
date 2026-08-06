/**
 * Palette graphique VenuD'où — validée (contraste, daltonisme) sur fond clair.
 * Ordre catégoriel FIXE : bleu, turquoise, violet (violet = secondaire, stats).
 * Ne jamais recycler ces couleurs pour un 4e statut : regrouper en « Autres ».
 */
export const CHART_CATEGORICAL = ['#2E5FA3', '#14A49B', '#7C5FC9'] as const;

export const CHART_SINGLE = '#14A49B'; // séries seules (magnitude)
export const CHART_GRID = '#ECEFF4';
export const CHART_TEXT = '#4F77A8';

/** Échelle séquentielle turquoise (heatmap) — clair → foncé. */
export function sequentialTurquoise(t: number): string {
  const stops = ['#EFFCFA', '#C8F5EF', '#92EBE1', '#57D9CD', '#2AC0B5', '#14A49B', '#0E6A66'];
  const clamped = Math.max(0, Math.min(1, t));
  return stops[Math.round(clamped * (stops.length - 1))];
}
