import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/lib/org-context';
import type { Plan } from '@/lib/types';
import { PageHeader, Badge, Spinner } from '@/components/ui/misc';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatDate, formatPrice } from '@/lib/format';

const STATUS_LABELS: Record<string, { label: string; tone: 'green' | 'turquoise' | 'red' | 'gray' }> = {
  trialing: { label: "Période d'essai", tone: 'turquoise' },
  active: { label: 'Actif', tone: 'green' },
  free: { label: 'Accès gratuit', tone: 'green' },
  suspended: { label: 'Suspendu', tone: 'red' },
  canceled: { label: 'Résilié', tone: 'gray' },
};

export default function Abonnement() {
  const { subscription, locations, locationLimit } = useOrg();
  const [plans, setPlans] = useState<Plan[] | null>(null);

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setPlans((data ?? []) as Plan[]));
  }, []);

  if (!plans) return <Spinner />;

  const status = subscription ? STATUS_LABELS[subscription.status] : null;

  return (
    <div>
      <PageHeader title="Abonnement" description="Votre offre actuelle et les offres disponibles. Le paiement en ligne arrive bientôt — contactez-nous pour changer d'offre." />
      <Card className="mb-6 max-w-xl">
        <CardTitle>Votre offre</CardTitle>
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold text-navy-900">{subscription?.plan?.name ?? '—'}</p>
          {status && <Badge tone={status.tone}>{status.label}</Badge>}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-navy-600">
          <li>
            Établissements : {locations.length} / {locationLimit ?? 'sur mesure'}
            {subscription?.max_locations_override !== null &&
              subscription?.max_locations_override !== undefined && (
                <span className="ml-2 text-xs text-navy-400">(limite personnalisée)</span>
              )}
          </li>
          {subscription?.status === 'trialing' && subscription.trial_ends_at && (
            <li>Fin de l'essai : {formatDate(subscription.trial_ends_at)}</li>
          )}
          <li>Début : {formatDate(subscription?.starts_at)}</li>
        </ul>
      </Card>

      <h2 className="mb-3 text-lg font-bold text-navy-900">Offres disponibles</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {plans.map((p) => (
          <Card key={p.id} className={p.id === subscription?.plan_id ? 'border-turquoise-400' : ''}>
            <p className="font-bold text-navy-900">{p.name}</p>
            <p className="mt-1 text-2xl font-bold text-navy-800">
              {p.max_locations === null ? 'Sur devis' : `${formatPrice(p.price_monthly_cents)} / mois`}
            </p>
            <p className="mt-1 text-sm text-navy-500">{p.description}</p>
            {p.id === subscription?.plan_id && (
              <Badge tone="turquoise">Votre offre</Badge>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
