import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuditLog, Organization } from '@/lib/types';
import { PageHeader, Spinner, Badge } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/format';

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  useEffect(() => {
    void (async () => {
      const [lRes, oRes] = await Promise.all([
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('organizations').select('*'),
      ]);
      setLogs((lRes.data ?? []) as AuditLog[]);
      setOrgs((oRes.data ?? []) as Organization[]);
    })();
  }, []);

  if (!logs) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Journaux d'audit"
        description="Actions administratives sensibles (200 dernières entrées)."
      />
      <Card>
        {logs.length === 0 ? (
          <p className="text-sm text-navy-500">Aucune entrée pour le moment.</p>
        ) : (
          <ul className="divide-y divide-navy-50">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="font-mono text-sm font-semibold text-navy-800">{log.action}</p>
                  <p className="text-xs text-navy-400">
                    {orgs.find((o) => o.id === log.organization_id)?.name ?? 'Plateforme'} —{' '}
                    {log.target_type} {log.target_id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={log.actor_role === 'super_admin' ? 'violet' : 'navy'}>
                    {log.actor_role}
                  </Badge>
                  <span className="text-xs text-navy-400">{formatDateTime(log.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
