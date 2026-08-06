import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Organization, OrganizationSubscription, Plan } from '@/lib/types';
import { PageHeader, Spinner, Badge } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField, TextareaField } from '@/components/ui/Field';
import { formatDate } from '@/lib/format';

interface OrgRow extends Organization {
  subscription: (OrganizationSubscription & { plan: Plan | null }) | null;
  locationCount: number;
}

export default function Organisations() {
  const [orgs, setOrgs] = useState<OrgRow[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<OrgRow | null>(null);
  const [form, setForm] = useState({ planId: '', status: 'trialing', override: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [orgRes, subRes, locRes, planRes] = await Promise.all([
      supabase.from('organizations').select('*').order('created_at', { ascending: false }),
      supabase.from('organization_subscriptions').select('*, plan:plans(*)'),
      supabase.from('locations').select('id, organization_id'),
      supabase.from('plans').select('*').order('sort_order'),
    ]);
    setPlans((planRes.data ?? []) as Plan[]);
    const subs = subRes.data ?? [];
    const locs = locRes.data ?? [];
    setOrgs(
      ((orgRes.data ?? []) as Organization[]).map((o) => ({
        ...o,
        subscription:
          (subs.find((s) => s.organization_id === o.id) as OrgRow['subscription']) ?? null,
        locationCount: locs.filter((l) => l.organization_id === o.id).length,
      })),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(org: OrgRow) {
    setEditing(org);
    setForm({
      planId: org.subscription?.plan_id ?? '',
      status: org.subscription?.status ?? 'trialing',
      override: org.subscription?.max_locations_override?.toString() ?? '',
      notes: org.subscription?.notes ?? '',
    });
    setError(null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const payload = {
      plan_id: form.planId,
      status: form.status,
      max_locations_override: form.override ? Number(form.override) : null,
      notes: form.notes,
    };
    const existing = editing.subscription;
    const { error: err } = existing
      ? await supabase.from('organization_subscriptions').update(payload).eq('id', existing.id)
      : await supabase
          .from('organization_subscriptions')
          .insert({ ...payload, organization_id: editing.id });
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    await supabase.rpc('log_audit', {
      p_org: editing.id,
      p_action: 'subscription.updated_by_super_admin',
      p_target_type: 'organization',
      p_target_id: editing.id,
      p_metadata: payload,
    });
    setSaving(false);
    setEditing(null);
    await load();
  }

  async function toggleSuspend(org: OrgRow) {
    const next = org.status === 'active' ? 'suspended' : 'active';
    await supabase.from('organizations').update({ status: next }).eq('id', org.id);
    await supabase.rpc('log_audit', {
      p_org: org.id,
      p_action: next === 'suspended' ? 'organization.suspended' : 'organization.reactivated',
      p_target_type: 'organization',
      p_target_id: org.id,
    });
    await load();
  }

  if (!orgs) return <Spinner />;

  const statusLabels: Record<string, string> = {
    trialing: 'Essai',
    active: 'Actif',
    free: 'Gratuit',
    suspended: 'Suspendu',
    canceled: 'Résilié',
  };

  return (
    <div>
      <PageHeader
        title="Organisations"
        description="Comptes clients : offres, limites personnalisées, accès gratuits, suspensions."
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs text-navy-400 uppercase">
                <th className="py-2 pr-4">Organisation</th>
                <th className="py-2 pr-4">Offre</th>
                <th className="py-2 pr-4">Statut abonnement</th>
                <th className="py-2 pr-4">Établissements</th>
                <th className="py-2 pr-4">Créée le</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                const limit =
                  org.subscription?.max_locations_override ??
                  org.subscription?.plan?.max_locations ??
                  null;
                return (
                  <tr key={org.id} className="border-b border-navy-50 align-top">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-navy-800">{org.name}</p>
                      {org.status === 'suspended' && <Badge tone="red">Organisation suspendue</Badge>}
                    </td>
                    <td className="py-3 pr-4">
                      {org.subscription?.plan?.name ?? '—'}
                      {org.subscription?.max_locations_override !== null &&
                        org.subscription?.max_locations_override !== undefined && (
                          <Badge tone="violet">limite perso.</Badge>
                        )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        tone={
                          org.subscription?.status === 'free'
                            ? 'green'
                            : org.subscription?.status === 'suspended'
                              ? 'red'
                              : 'navy'
                        }
                      >
                        {statusLabels[org.subscription?.status ?? ''] ?? '—'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {org.locationCount} / {limit ?? '∞'}
                    </td>
                    <td className="py-3 pr-4">{formatDate(org.created_at)}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(org)}>
                          Offre & limites
                        </Button>
                        <Button
                          variant={org.status === 'active' ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => void toggleSuspend(org)}
                        >
                          {org.status === 'active' ? 'Suspendre' : 'Réactiver'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Offre de ${editing?.name ?? ''}`}
      >
        <div className="space-y-4">
          <SelectField
            label="Plan"
            value={form.planId}
            onChange={(e) => setForm({ ...form, planId: e.target.value })}
          >
            <option value="">Choisir…</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.max_locations ?? 'sur mesure'} établissement(s))
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Statut"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            hint="« Gratuit » = accès offert (ex. client pilote)."
          >
            <option value="trialing">Essai</option>
            <option value="active">Actif</option>
            <option value="free">Gratuit</option>
            <option value="suspended">Suspendu</option>
            <option value="canceled">Résilié</option>
          </SelectField>
          <InputField
            label="Limite d'établissements personnalisée"
            type="number"
            min={1}
            hint="Vide = limite du plan. Ex. : 3 pour Trust Industrie."
            value={form.override}
            onChange={(e) => setForm({ ...form, override: e.target.value })}
          />
          <TextareaField
            label="Notes internes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button className="w-full" loading={saving} onClick={() => void save()}>
            Enregistrer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
