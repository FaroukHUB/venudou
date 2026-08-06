import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Device, Location, Organization } from '@/lib/types';
import { PageHeader, Spinner, Badge } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { isDeviceOnline, formatDateTime } from '@/lib/format';

export default function Tablettes() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    void (async () => {
      const [dRes, oRes, lRes] = await Promise.all([
        supabase
          .from('devices')
          .select(
            'id, organization_id, location_id, name, status, activated_at, last_seen_at, created_at',
          )
          .order('last_seen_at', { ascending: false, nullsFirst: false }),
        supabase.from('organizations').select('*'),
        supabase.from('locations').select('*'),
      ]);
      setDevices((dRes.data ?? []) as Device[]);
      setOrgs((oRes.data ?? []) as Organization[]);
      setLocations((lRes.data ?? []) as Location[]);
    })();
  }, []);

  if (!devices) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Tablettes"
        description="Toutes les tablettes actives et en attente d'activation."
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs text-navy-400 uppercase">
                <th className="py-2 pr-4">Tablette</th>
                <th className="py-2 pr-4">Organisation</th>
                <th className="py-2 pr-4">Établissement</th>
                <th className="py-2 pr-4">État</th>
                <th className="py-2">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-navy-50">
                  <td className="py-2.5 pr-4 font-semibold text-navy-800">{d.name}</td>
                  <td className="py-2.5 pr-4">
                    {orgs.find((o) => o.id === d.organization_id)?.name ?? '—'}
                  </td>
                  <td className="py-2.5 pr-4">
                    {locations.find((l) => l.id === d.location_id)?.name ?? '—'}
                  </td>
                  <td className="py-2.5 pr-4">
                    {d.status === 'pending' && <Badge tone="gray">À activer</Badge>}
                    {d.status === 'disabled' && <Badge tone="red">Désactivée</Badge>}
                    {d.status === 'active' &&
                      (isDeviceOnline(d.last_seen_at) ? (
                        <Badge tone="green">En ligne</Badge>
                      ) : (
                        <Badge tone="red">Hors ligne</Badge>
                      ))}
                  </td>
                  <td className="py-2.5">{formatDateTime(d.last_seen_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
