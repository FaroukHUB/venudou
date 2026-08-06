import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useOrg } from '@/lib/org-context';
import { fetchDevices, fetchReviewEvents, fetchRewardCodes, fetchSessions, periodFromPreset } from '../data';
import type { SessionLite } from '@/lib/stats';
import { countByDay, countByKind, countByLocation } from '@/lib/stats';
import { isDeviceOnline } from '@/lib/format';
import type { Device, ReviewEvent, RewardCode } from '@/lib/types';
import { PageHeader, Spinner, StatCard, ErrorState, Badge } from '@/components/ui/misc';
import { Card, CardTitle } from '@/components/ui/Card';
import { TimeSeries, DistributionBar } from '@/components/charts';

export default function Overview() {
  const { current, locations } = useOrg();
  const orgId = current?.organization.id;
  const [sessions, setSessions] = useState<SessionLite[] | null>(null);
  const [events, setEvents] = useState<ReviewEvent[]>([]);
  const [rewards, setRewards] = useState<RewardCode[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    const period = periodFromPreset('30d');
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
  }, [orgId]);

  const stats = useMemo(() => {
    if (!sessions) return null;
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const inRange = (s: SessionLite, from: Date) => new Date(s.created_at) >= from;
    const sources = countByKind(sessions, 'source');
    return {
      today: sessions.filter((s) => inRange(s, startOfDay)).length,
      week: sessions.filter((s) => inRange(s, startOfWeek)).length,
      month: sessions.filter((s) => inRange(s, startOfMonth)).length,
      topSource: sources[0] ?? null,
      sources,
      scans: events.filter((e) => e.event_type === 'link_opened').length,
      rewardsGiven: rewards.length,
      rewardsRedeemed: rewards.filter((r) => r.status === 'redeemed').length,
      byDay: countByDay(sessions),
      byLocation: countByLocation(sessions),
    };
  }, [sessions, events, rewards]);

  if (error) return <ErrorState message={error} />;
  if (!stats || !sessions) return <Spinner />;

  const online = devices.filter((d) => d.status === 'active' && isDeviceOnline(d.last_seen_at));

  return (
    <div>
      <PageHeader
        title="Vue générale"
        description={`${current?.organization.name} — 30 derniers jours`}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Aujourd'hui" value={stats.today} sub="réponses" />
        <StatCard label="Cette semaine" value={stats.week} sub="réponses" />
        <StatCard label="Ce mois" value={stats.month} sub="réponses" />
        <StatCard
          label="Provenance nº1"
          value={stats.topSource?.label ?? '—'}
          sub={stats.topSource ? `${stats.topSource.count} réponses` : 'aucune donnée'}
          accent="turquoise"
        />
        <StatCard label="Scans vers les avis" value={stats.scans} accent="turquoise" />
        <StatCard
          label="Gains distribués"
          value={stats.rewardsGiven}
          sub={`${stats.rewardsRedeemed} utilisés`}
          accent="violet"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Réponses par jour</CardTitle>
          <TimeSeries
            data={stats.byDay.map((d) => ({ day: d.day.slice(5), count: d.count }))}
            series={[{ key: 'count', label: 'Réponses' }]}
          />
        </Card>
        <Card>
          <CardTitle>Répartition des provenances</CardTitle>
          <DistributionBar data={stats.sources} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Vos établissements</CardTitle>
          {locations.length === 0 ? (
            <p className="text-sm text-navy-500">
              Aucun établissement.{' '}
              <Link to="/app/etablissements" className="font-semibold text-turquoise-600 hover:underline">
                Créer le premier
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-navy-50">
              {locations.map((loc) => (
                <li key={loc.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-semibold text-navy-800">{loc.name}</p>
                    <p className="text-xs text-navy-400">{loc.city || '—'}</p>
                  </div>
                  <p className="text-sm font-bold text-navy-700 tabular-nums">
                    {stats.byLocation.get(loc.id) ?? 0}{' '}
                    <span className="font-normal text-navy-400">réponses / 30 j</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
          {locations.length > 1 && (
            <Link
              to="/app/statistiques"
              className="mt-3 inline-block text-sm font-semibold text-turquoise-600 hover:underline"
            >
              Comparer les établissements →
            </Link>
          )}
        </Card>
        <Card>
          <CardTitle>Tablettes</CardTitle>
          {devices.length === 0 ? (
            <p className="text-sm text-navy-500">
              Aucune tablette.{' '}
              <Link to="/app/tablettes" className="font-semibold text-turquoise-600 hover:underline">
                Installer une tablette
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-navy-50">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-semibold text-navy-800">{d.name}</p>
                    <p className="text-xs text-navy-400">
                      {locations.find((l) => l.id === d.location_id)?.name ?? ''}
                    </p>
                  </div>
                  {d.status !== 'active' ? (
                    <Badge tone="gray">En attente</Badge>
                  ) : isDeviceOnline(d.last_seen_at) ? (
                    <Badge tone="green">En ligne</Badge>
                  ) : (
                    <Badge tone="red">Hors ligne</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-navy-400">
            {online.length} tablette{online.length > 1 ? 's' : ''} en ligne (vue il y a moins de 5
            minutes)
          </p>
        </Card>
      </div>
    </div>
  );
}
