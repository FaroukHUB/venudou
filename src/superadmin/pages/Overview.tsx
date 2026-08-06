import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader, Spinner, StatCard } from '@/components/ui/misc';
import { Card, CardTitle } from '@/components/ui/Card';
import { isDeviceOnline } from '@/lib/format';

interface Totals {
  organizations: number;
  suspended: number;
  locations: number;
  users: number;
  devices: number;
  devicesOnline: number;
  sessions30d: number;
  sessions7d: number;
  freeAccounts: number;
}

export default function Overview() {
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    void (async () => {
      const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
      const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();
      const [orgs, locs, profiles, devices, s30, s7, subs] = await Promise.all([
        supabase.from('organizations').select('id, status'),
        supabase.from('locations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('devices').select('id, status, last_seen_at'),
        supabase
          .from('survey_sessions')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', since30),
        supabase
          .from('survey_sessions')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', since7),
        supabase.from('organization_subscriptions').select('id, status'),
      ]);
      setTotals({
        organizations: orgs.data?.length ?? 0,
        suspended: orgs.data?.filter((o) => o.status === 'suspended').length ?? 0,
        locations: locs.count ?? 0,
        users: profiles.count ?? 0,
        devices: devices.data?.length ?? 0,
        devicesOnline:
          devices.data?.filter((d) => d.status === 'active' && isDeviceOnline(d.last_seen_at))
            .length ?? 0,
        sessions30d: s30.count ?? 0,
        sessions7d: s7.count ?? 0,
        freeAccounts: subs.data?.filter((s) => s.status === 'free').length ?? 0,
      });
    })();
  }, []);

  if (!totals) return <Spinner />;

  return (
    <div>
      <PageHeader title="Aperçu global" description="Utilisation générale de la plateforme VenuD'où." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Organisations" value={totals.organizations} sub={`${totals.suspended} suspendue(s)`} />
        <StatCard label="Établissements" value={totals.locations} />
        <StatCard label="Utilisateurs" value={totals.users} />
        <StatCard label="Comptes gratuits" value={totals.freeAccounts} accent="violet" />
        <StatCard
          label="Tablettes"
          value={totals.devices}
          sub={`${totals.devicesOnline} en ligne`}
          accent="turquoise"
        />
        <StatCard label="Réponses (7 j)" value={totals.sessions7d} accent="turquoise" />
        <StatCard label="Réponses (30 j)" value={totals.sessions30d} accent="turquoise" />
      </div>
      <Card className="mt-6 max-w-2xl">
        <CardTitle>Rappels</CardTitle>
        <ul className="list-disc space-y-1 pl-5 text-sm text-navy-600">
          <li>Le rôle super-admin s'attribue uniquement en base (table super_admins, clé service).</li>
          <li>Les suspensions et overrides de limites sont journalisés dans les journaux d'audit.</li>
          <li>Les prix des offres se modifient dans « Plans & offres » — jamais dans le code.</li>
        </ul>
      </Card>
    </div>
  );
}
