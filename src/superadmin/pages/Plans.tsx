import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Plan } from '@/lib/types';
import { PageHeader, Spinner, Toggle } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';

export default function Plans() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { price: string; max: string }>>({});
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    supabase
      .from('plans')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        const list = (data ?? []) as Plan[];
        setPlans(list);
        setDrafts(
          Object.fromEntries(
            list.map((p) => [
              p.id,
              {
                price: (p.price_monthly_cents / 100).toString(),
                max: p.max_locations?.toString() ?? '',
              },
            ]),
          ),
        );
      });
  }, []);

  useEffect(load, [load]);

  async function save(plan: Plan) {
    const draft = drafts[plan.id];
    const { error } = await supabase
      .from('plans')
      .update({
        price_monthly_cents: Math.round(Number(draft.price) * 100) || 0,
        max_locations: draft.max ? Number(draft.max) : null,
      })
      .eq('id', plan.id);
    setMessage(error ? error.message : `Offre « ${plan.name} » mise à jour.`);
    if (!error) {
      await supabase.rpc('log_audit', {
        p_org: null,
        p_action: 'plan.updated',
        p_target_type: 'plan',
        p_target_id: plan.id,
        p_metadata: { price: draft.price, max_locations: draft.max },
      });
    }
    load();
  }

  async function toggleActive(plan: Plan, active: boolean) {
    await supabase.from('plans').update({ is_active: active }).eq('id', plan.id);
    load();
  }

  if (!plans) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Plans & offres"
        description="Prix et limites des offres commerciales — la source de vérité pour tout le produit."
      />
      {message && (
        <p className="mb-4 rounded-xl bg-turquoise-50 px-4 py-2 text-sm text-turquoise-800" role="status">
          {message}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-navy-900">{p.name}</p>
              <Toggle
                checked={p.is_active}
                onChange={(v) => void toggleActive(p, v)}
                label={`Offre active : ${p.name}`}
              />
            </div>
            <p className="text-xs text-navy-400">
              {p.code} — actuellement {formatPrice(p.price_monthly_cents)} / mois
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-navy-500">
                Prix mensuel (€)
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-navy-200 px-2 py-1.5 text-sm font-normal"
                  value={drafts[p.id]?.price ?? ''}
                  onChange={(e) =>
                    setDrafts({ ...drafts, [p.id]: { ...drafts[p.id], price: e.target.value } })
                  }
                />
              </label>
              <label className="text-xs font-semibold text-navy-500">
                Max. établissements
                <input
                  type="number"
                  min={1}
                  placeholder="sur mesure"
                  className="mt-1 w-full rounded-lg border border-navy-200 px-2 py-1.5 text-sm font-normal"
                  value={drafts[p.id]?.max ?? ''}
                  onChange={(e) =>
                    setDrafts({ ...drafts, [p.id]: { ...drafts[p.id], max: e.target.value } })
                  }
                />
              </label>
            </div>
            <Button size="sm" className="mt-3" onClick={() => void save(p)}>
              Enregistrer
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
