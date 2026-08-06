import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader, Spinner, Badge } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/format';

interface ProfileRow {
  id: string;
  full_name: string | null;
  created_at: string;
}

interface MemberRow {
  user_id: string;
  role: string;
  organization: { name: string } | null;
}

export default function Utilisateurs() {
  const [profiles, setProfiles] = useState<ProfileRow[] | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);

  useEffect(() => {
    void (async () => {
      const [pRes, mRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('organization_members').select('user_id, role, organization:organizations(name)'),
      ]);
      setProfiles((pRes.data ?? []) as ProfileRow[]);
      setMembers((mRes.data ?? []) as unknown as MemberRow[]);
    })();
  }, []);

  if (!profiles) return <Spinner />;

  return (
    <div>
      <PageHeader title="Utilisateurs" description="Comptes utilisateurs et leurs organisations." />
      <Card>
        <ul className="divide-y divide-navy-50">
          {profiles.map((p) => {
            const orgs = members.filter((m) => m.user_id === p.id);
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-navy-800">{p.full_name || 'Sans nom'}</p>
                  <p className="text-xs text-navy-400">Inscrit le {formatDate(p.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {orgs.length === 0 && <Badge tone="gray">Aucune organisation</Badge>}
                  {orgs.map((m, i) => (
                    <Badge key={i} tone={m.role === 'organization_owner' ? 'turquoise' : 'navy'}>
                      {m.organization?.name} — {m.role.replace('organization_', '').replace('location_', '')}
                    </Badge>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
