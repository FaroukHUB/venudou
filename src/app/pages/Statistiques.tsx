import { useEffect, useMemo, useState } from 'react';
import { useOrg } from '@/lib/org-context';
import { fetchDevices, fetchReviewEvents, fetchRewardCodes, fetchSessions, periodFromPreset } from '../data';
import {
  applyFilters,
  countByDay,
  countByKind,
  crossTab,
  heatmapDayHour,
  optionalAnswerRate,
  type SessionLite,
} from '@/lib/stats';
import type { Device, ReviewEvent, RewardCode } from '@/lib/types';
import { PageHeader, Spinner, StatCard, ErrorState } from '@/components/ui/misc';
import { Card, CardTitle } from '@/components/ui/Card';
import { DistributionBar, TimeSeries, GroupedBars, DayHourHeatmap } from '@/components/charts';
import { percent } from '@/lib/format';

const PERIODS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
];

const selectClass =
  'rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-800';

export default function Statistiques() {
  const { current, locations } = useOrg();
  const orgId = current?.organization.id;
  const [preset, setPreset] = useState('30d');
  const [sessions, setSessions] = useState<SessionLite[] | null>(null);
  const [events, setEvents] = useState<ReviewEvent[]>([]);
  const [rewards, setRewards] = useState<RewardCode[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    locationId: '',
    deviceId: '',
    source: '',
    gender: '',
    ageRange: '',
  });

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    setSessions(null);
    const period = periodFromPreset(preset);
    Promise.all([
      fetchSessions(orgId, period),
      fetchReviewEvents(orgId, period),
      fetchRewardCodes(orgId, period),
      fetchDevices(orgId),
    ])
      .then(([s, e, r, d]) => {
        if (cancelled) return;
        setSessions(s);
        setEvents(e);
        setRewards(r);
        setDevices(d);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [orgId, preset]);

  const allSources = useMemo(() => countByKind(sessions ?? [], 'source'), [sessions]);
  const allGenders = useMemo(() => countByKind(sessions ?? [], 'gender'), [sessions]);
  const allAges = useMemo(() => countByKind(sessions ?? [], 'age_range'), [sessions]);

  const filtered = useMemo(
    () =>
      applyFilters(sessions ?? [], {
        locationId: filters.locationId || undefined,
        deviceId: filters.deviceId || undefined,
        source: filters.source || undefined,
        gender: filters.gender || undefined,
        ageRange: filters.ageRange || undefined,
      }),
    [sessions, filters],
  );

  const analysis = useMemo(() => {
    const sources = countByKind(filtered, 'source');
    const byDay = countByDay(filtered);
    const sourceByGender = crossTab(filtered, 'source', 'gender');
    const sourceByAge = crossTab(filtered, 'source', 'age_range');
    const genderKeys = allGenders.map((g) => ({ key: g.value, label: g.label }));
    const ageKeys = allAges.map((a) => ({ key: a.value, label: a.label })).slice(0, 3);
    const heat = heatmapDayHour(filtered);
    // Comparaison par établissement
    const perLocation = locations.map((loc) => {
      const locSessions = filtered.filter((s) => s.location_id === loc.id);
      const top = countByKind(locSessions, 'source')[0];
      return {
        loc,
        count: locSessions.length,
        topSource: top?.label ?? '—',
        scans: events.filter((e) => e.location_id === loc.id && e.event_type === 'link_opened').length,
        rewards: rewards.filter((r) => r.location_id === loc.id).length,
      };
    });
    const comparisonSeries = locations.slice(0, 3).map((l) => ({ key: l.id, label: l.name }));
    const comparisonByDayMap = new Map<string, Record<string, string | number>>();
    for (const s of filtered) {
      const day = s.created_at.slice(0, 10);
      const row = comparisonByDayMap.get(day) ?? { day: day.slice(5) };
      row[s.location_id] = ((row[s.location_id] as number) ?? 0) + 1;
      comparisonByDayMap.set(day, row);
    }
    return {
      sources,
      byDay,
      sourceByGender,
      sourceByAge,
      genderKeys,
      ageKeys,
      heat,
      perLocation,
      comparisonSeries,
      comparisonByDay: [...comparisonByDayMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, row]) => row),
      genderRate: optionalAnswerRate(filtered, 'gender'),
      ageRate: optionalAnswerRate(filtered, 'age_range'),
    };
  }, [filtered, locations, events, rewards, allGenders, allAges]);

  if (error) return <ErrorState message={error} />;
  if (!sessions) return <Spinner />;

  return (
    <div>
      <PageHeader title="Statistiques" description="Analysez la provenance et le profil de vos clients, filtrez et comparez vos établissements." />

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtres">
        <select className={selectClass} aria-label="Période" value={preset} onChange={(e) => setPreset(e.target.value)}>
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          aria-label="Établissement"
          value={filters.locationId}
          onChange={(e) => setFilters({ ...filters, locationId: e.target.value, deviceId: '' })}
        >
          <option value="">Tous les établissements</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          aria-label="Tablette"
          value={filters.deviceId}
          onChange={(e) => setFilters({ ...filters, deviceId: e.target.value })}
        >
          <option value="">Toutes les tablettes</option>
          {devices
            .filter((d) => !filters.locationId || d.location_id === filters.locationId)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
        <select
          className={selectClass}
          aria-label="Provenance"
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
        >
          <option value="">Toutes les provenances</option>
          {allSources.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          aria-label="Genre"
          value={filters.gender}
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
        >
          <option value="">Tous les genres</option>
          {allGenders.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          aria-label="Tranche d'âge"
          value={filters.ageRange}
          onChange={(e) => setFilters({ ...filters, ageRange: e.target.value })}
        >
          <option value="">Tous les âges</option>
          {allAges.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Réponses (filtrées)" value={filtered.length} />
        <StatCard
          label="Taux de réponse genre"
          value={percent(Math.round(analysis.genderRate * filtered.length), filtered.length)}
          sub="question facultative"
          accent="turquoise"
        />
        <StatCard
          label="Taux de réponse âge"
          value={percent(Math.round(analysis.ageRate * filtered.length), filtered.length)}
          sub="question facultative"
          accent="turquoise"
        />
        <StatCard
          label="Gains générés"
          value={rewards.length}
          sub={`${rewards.filter((r) => r.status === 'redeemed').length} utilisés`}
          accent="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Répartition des provenances</CardTitle>
          <DistributionBar data={analysis.sources} />
        </Card>
        <Card>
          <CardTitle>Évolution dans le temps</CardTitle>
          <TimeSeries
            data={analysis.byDay.map((d) => ({ day: d.day.slice(5), count: d.count }))}
            series={[{ key: 'count', label: 'Réponses' }]}
          />
        </Card>
        <Card>
          <CardTitle>Provenance par genre</CardTitle>
          <GroupedBars
            data={analysis.sourceByGender.map((r) => ({ source: r.aLabel, ...r.byB }))}
            categoryKey="source"
            series={analysis.genderKeys}
          />
        </Card>
        <Card>
          <CardTitle>Provenance par tranche d'âge (3 premières)</CardTitle>
          <GroupedBars
            data={analysis.sourceByAge.map((r) => ({ source: r.aLabel, ...r.byB }))}
            categoryKey="source"
            series={analysis.ageKeys}
          />
        </Card>
      </div>

      {locations.length > 1 && (
        <Card className="mt-6">
          <CardTitle>Comparaison entre établissements</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs text-navy-400 uppercase">
                  <th className="py-2 pr-4">Établissement</th>
                  <th className="py-2 pr-4">Réponses</th>
                  <th className="py-2 pr-4">Provenance nº1</th>
                  <th className="py-2 pr-4">Scans avis</th>
                  <th className="py-2">Gains</th>
                </tr>
              </thead>
              <tbody>
                {analysis.perLocation.map(({ loc, count, topSource, scans, rewards: rw }) => (
                  <tr key={loc.id} className="border-b border-navy-50">
                    <td className="py-2.5 pr-4 font-semibold text-navy-800">{loc.name}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{count}</td>
                    <td className="py-2.5 pr-4">{topSource}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{scans}</td>
                    <td className="py-2.5 tabular-nums">{rw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <TimeSeries data={analysis.comparisonByDay} series={analysis.comparisonSeries} height={280} />
          </div>
          {locations.length > 3 && (
            <p className="mt-2 text-xs text-navy-400">
              Le graphique affiche les 3 premiers établissements ; le tableau les couvre tous.
            </p>
          )}
        </Card>
      )}

      <Card className="mt-6">
        <CardTitle>Volume de réponses par jour et heure</CardTitle>
        <DayHourHeatmap grid={analysis.heat} />
      </Card>
    </div>
  );
}
