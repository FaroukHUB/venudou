import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Location, Organization } from '@/lib/types';
import { PageHeader, Spinner, Badge } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/format';

export default function Etablissements() {
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  useEffect(() => {
    void (async () => {
      const [locRes, orgRes] = await Promise.all([
        supabase.from('locations').select('*').order('created_at', { ascending: false }),
        supabase.from('organizations').select('*'),
      ]);
      setLocations((locRes.data ?? []) as Location[]);
      setOrgs((orgRes.data ?? []) as Organization[]);
    })();
  }, []);

  if (!locations) return <Spinner />;

  return (
    <div>
      <PageHeader title="Établissements" description="Tous les établissements de la plateforme." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs text-navy-400 uppercase">
                <th className="py-2 pr-4">Établissement</th>
                <th className="py-2 pr-4">Organisation</th>
                <th className="py-2 pr-4">Ville</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l.id} className="border-b border-navy-50">
                  <td className="py-2.5 pr-4 font-semibold text-navy-800">{l.name}</td>
                  <td className="py-2.5 pr-4">{orgs.find((o) => o.id === l.organization_id)?.name ?? '—'}</td>
                  <td className="py-2.5 pr-4">{l.city || '—'}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={l.status === 'active' ? 'green' : 'gray'}>
                      {l.status === 'active' ? 'Actif' : 'Archivé'}
                    </Badge>
                  </td>
                  <td className="py-2.5">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
