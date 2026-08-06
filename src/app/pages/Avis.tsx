import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/lib/org-context';
import { fetchReviewEvents, periodFromPreset } from '../data';
import type { ReviewEvent, ReviewLink } from '@/lib/types';
import { PageHeader, Spinner, StatCard } from '@/components/ui/misc';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/Field';
import { percent } from '@/lib/format';

export default function Avis() {
  const { current, locations } = useOrg();
  const orgId = current?.organization.id;
  const [links, setLinks] = useState<ReviewLink[]>([]);
  const [events, setEvents] = useState<ReviewEvent[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    if (!orgId) return;
    supabase
      .from('review_links')
      .select('*')
      .eq('organization_id', orgId)
      .then(({ data }) => setLinks((data ?? []) as ReviewLink[]));
    fetchReviewEvents(orgId, periodFromPreset('30d')).then(setEvents);
  }, [orgId]);

  useEffect(load, [load]);

  const stats = useMemo(() => {
    const e = events ?? [];
    const count = (t: string) => e.filter((x) => x.event_type === t).length;
    return {
      shown: count('prompt_shown'),
      accepted: count('accepted'),
      qr: count('qr_displayed'),
      opened: count('link_opened'),
    };
  }, [events]);

  async function saveLink(locationId: string) {
    const url = drafts[locationId]?.trim();
    if (!url) return;
    const { data, error } = await supabase.rpc('upsert_review_link', {
      p_location: locationId,
      p_url: url,
    });
    const res = data as { ok: boolean; error?: string } | null;
    setMessages((m) => ({
      ...m,
      [locationId]: error
        ? error.message
        : res?.ok
          ? 'Lien enregistré.'
          : res?.error === 'INVALID_URL'
            ? 'URL invalide : elle doit commencer par https://'
            : (res?.error ?? 'Erreur'),
    }));
    load();
  }

  if (!events) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Avis Google"
        description="Après le questionnaire, la tablette propose de laisser un avis — sans jamais filtrer les clients selon leur satisfaction. Nous mesurons les étapes du parcours, pas la publication réelle de l'avis."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Propositions affichées" value={stats.shown} sub="30 derniers jours" />
        <StatCard
          label="Clics sur « Oui »"
          value={stats.accepted}
          sub={`${percent(stats.accepted, stats.shown)} des propositions`}
          accent="turquoise"
        />
        <StatCard label="QR codes affichés" value={stats.qr} accent="turquoise" />
        <StatCard label="Liens ouverts (scans)" value={stats.opened} accent="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {locations.map((loc) => {
          const link = links.find((l) => l.location_id === loc.id);
          return (
            <Card key={loc.id}>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Star className="size-4 text-turquoise-600" aria-hidden /> {loc.name}
                </span>
              </CardTitle>
              <InputField
                label="Lien d'avis Google de cet établissement"
                placeholder="https://g.page/r/…/review"
                hint="Google Business Profile → Demander des avis → copier le lien."
                defaultValue={link?.url ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [loc.id]: e.target.value }))}
              />
              <div className="mt-3 flex items-center gap-3">
                <Button size="sm" onClick={() => void saveLink(loc.id)}>
                  Enregistrer
                </Button>
                {link && (
                  <a
                    href={`/r/${link.tracking_code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-turquoise-600 hover:underline"
                  >
                    Tester /r/{link.tracking_code} <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </div>
              {messages[loc.id] && (
                <p className="mt-2 text-sm text-navy-600" role="status">
                  {messages[loc.id]}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
