import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Gift, Plus, ScanLine } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/lib/org-context';
import type { RewardCampaign, RewardType } from '@/lib/types';
import { PageHeader, Spinner, Badge, Toggle, EmptyState } from '@/components/ui/misc';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField, TextareaField } from '@/components/ui/Field';
import { formatDate } from '@/lib/format';

const REWARD_TYPES: { value: RewardType; label: string }[] = [
  { value: 'percent', label: 'Réduction en pourcentage' },
  { value: 'fixed', label: 'Réduction fixe (€)' },
  { value: 'product', label: 'Produit offert' },
  { value: 'drink', label: 'Boisson offerte' },
  { value: 'dessert', label: 'Dessert offert' },
  { value: 'custom', label: 'Texte personnalisé' },
];

const emptyForm = {
  name: '',
  location_id: '',
  reward_type: 'percent' as RewardType,
  reward_value: '',
  reward_label: '',
  frequency_n: '10',
  max_discount: '',
  min_order: '',
  validity_days: '30',
  terms: '',
  max_total_wins: '',
};

export default function Recompenses() {
  const { current, locations } = useOrg();
  const orgId = current?.organization.id;
  const [campaigns, setCampaigns] = useState<RewardCampaign[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<RewardCampaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Validation de code
  const [codeInput, setCodeInput] = useState('');
  const [redeemResult, setRedeemResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const load = useCallback(() => {
    if (!orgId) return;
    supabase
      .from('reward_campaigns')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setCampaigns((data ?? []) as RewardCampaign[]);
      });
  }, [orgId]);

  useEffect(load, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c: RewardCampaign) {
    setEditing(c);
    setForm({
      name: c.name,
      location_id: c.location_id,
      reward_type: c.reward_type,
      reward_value: c.reward_value?.toString() ?? '',
      reward_label: c.reward_label,
      frequency_n: c.frequency_n.toString(),
      max_discount: c.max_discount_cents ? (c.max_discount_cents / 100).toString() : '',
      min_order: c.min_order_cents ? (c.min_order_cents / 100).toString() : '',
      validity_days: c.validity_days.toString(),
      terms: c.terms,
      max_total_wins: c.max_total_wins?.toString() ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  async function saveCampaign(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setError(null);
    const payload = {
      location_id: form.location_id,
      name: form.name,
      reward_type: form.reward_type,
      reward_value: form.reward_value ? Number(form.reward_value) : null,
      reward_label: form.reward_label,
      frequency_n: Math.max(1, Number(form.frequency_n) || 10),
      max_discount_cents: form.max_discount ? Math.round(Number(form.max_discount) * 100) : null,
      min_order_cents: form.min_order ? Math.round(Number(form.min_order) * 100) : null,
      validity_days: Math.max(1, Number(form.validity_days) || 30),
      terms: form.terms,
      max_total_wins: form.max_total_wins ? Number(form.max_total_wins) : null,
    };
    const { error: err } = editing
      ? await supabase.from('reward_campaigns').update(payload).eq('id', editing.id)
      : await supabase.from('reward_campaigns').insert({ organization_id: orgId, ...payload });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    load();
  }

  async function toggleCampaign(c: RewardCampaign, active: boolean) {
    await supabase.from('reward_campaigns').update({ is_active: active }).eq('id', c.id);
    load();
  }

  async function redeem(e: FormEvent) {
    e.preventDefault();
    setRedeeming(true);
    setRedeemResult(null);
    const { data, error: err } = await supabase.rpc('redeem_reward_code', {
      p_code: codeInput.trim(),
    });
    setRedeeming(false);
    if (err) {
      setRedeemResult({ ok: false, message: err.message });
      return;
    }
    const res = data as { ok: boolean; error?: string; label?: string };
    if (res.ok) {
      setRedeemResult({
        ok: true,
        message: `Code valide — « ${res.label} ». Le gain est maintenant marqué comme utilisé.`,
      });
      setCodeInput('');
    } else {
      const messages: Record<string, string> = {
        CODE_NOT_FOUND: 'Code inconnu.',
        ALREADY_REDEEMED: 'Ce code a déjà été utilisé.',
        CODE_EXPIRED: 'Ce code a expiré.',
        CODE_CANCELLED: 'Ce code a été annulé.',
        LOCATION_NOT_ACCEPTED: "Ce gain n'est pas accepté dans cet établissement.",
      };
      setRedeemResult({ ok: false, message: messages[res.error ?? ''] ?? 'Code invalide.' });
    }
  }

  if (!campaigns) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Récompenses — Instant gagnant"
        description="Fonction facultative : 1 gagnant toutes les N participations, tiré de manière sécurisée et aléatoire. La récompense concerne uniquement la participation au questionnaire, jamais la publication d'un avis."
        actions={
          <Button onClick={openCreate} disabled={locations.length === 0}>
            <Plus className="size-4" aria-hidden /> Nouvelle campagne
          </Button>
        }
      />

      <Card className="mb-6 max-w-xl">
        <CardTitle>
          <span className="flex items-center gap-2">
            <ScanLine className="size-5 text-turquoise-600" aria-hidden /> Vérifier et valider un
            code
          </span>
        </CardTitle>
        <form onSubmit={redeem} className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-navy-200 px-3.5 py-2.5 font-mono text-lg tracking-widest uppercase"
            placeholder="Ex. : K7X2M9PQ"
            aria-label="Code de gain à valider"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            required
          />
          <Button type="submit" loading={redeeming} variant="secondary">
            Valider
          </Button>
        </form>
        {redeemResult && (
          <p
            role="status"
            className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
              redeemResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {redeemResult.message}
          </p>
        )}
        <p className="mt-2 text-xs text-navy-400">
          Un code n'est utilisable qu'une seule fois : la validation le marque immédiatement comme
          utilisé.
        </p>
      </Card>

      {error && (
        <p className="mb-4 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      {campaigns.length === 0 ? (
        <EmptyState
          title="Aucune campagne de récompense"
          description="Créez une campagne « instant gagnant » pour encourager la participation au questionnaire."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Gift className="size-5 text-violet-600" aria-hidden />
                  <h2 className="font-bold text-navy-900">{c.name}</h2>
                </div>
                <Toggle
                  checked={c.is_active}
                  onChange={(v) => void toggleCampaign(c, v)}
                  label={`Campagne active : ${c.name}`}
                />
              </div>
              <p className="mt-1 text-sm text-navy-600">{c.reward_label}</p>
              <p className="text-xs text-navy-400">
                {locations.find((l) => l.id === c.location_id)?.name} — 1 gagnant / {c.frequency_n}{' '}
                participations — validité {c.validity_days} j
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="violet">{c.wins_count} gains</Badge>
                <Badge tone="navy">{c.participations_count} participations</Badge>
                {c.max_total_wins !== null && (
                  <Badge tone="gray">max {c.max_total_wins} gains</Badge>
                )}
                {!c.is_active && <Badge tone="gray">Désactivée</Badge>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-navy-400">Créée le {formatDate(c.created_at)}</p>
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  Modifier
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Modifier « ${editing.name} »` : 'Nouvelle campagne'}
      >
        <form onSubmit={saveCampaign} className="space-y-4">
          <InputField
            label="Nom de la campagne"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <SelectField
            label="Établissement"
            required
            value={form.location_id}
            onChange={(e) => setForm({ ...form, location_id: e.target.value })}
          >
            <option value="">Choisir…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Type de récompense"
            value={form.reward_type}
            onChange={(e) => setForm({ ...form, reward_type: e.target.value as RewardType })}
          >
            {REWARD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </SelectField>
          {(form.reward_type === 'percent' || form.reward_type === 'fixed') && (
            <InputField
              label={form.reward_type === 'percent' ? 'Valeur (%)' : 'Valeur (€)'}
              type="number"
              min={1}
              required
              value={form.reward_value}
              onChange={(e) => setForm({ ...form, reward_value: e.target.value })}
            />
          )}
          <InputField
            label="Libellé affiché au client"
            placeholder="Ex. : Un dessert offert !"
            required
            value={form.reward_label}
            onChange={(e) => setForm({ ...form, reward_label: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="1 gagnant toutes les…"
              type="number"
              min={1}
              hint="participations"
              value={form.frequency_n}
              onChange={(e) => setForm({ ...form, frequency_n: e.target.value })}
            />
            <InputField
              label="Validité (jours)"
              type="number"
              min={1}
              value={form.validity_days}
              onChange={(e) => setForm({ ...form, validity_days: e.target.value })}
            />
            <InputField
              label="Plafond de réduction (€)"
              type="number"
              min={0}
              value={form.max_discount}
              onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
            />
            <InputField
              label="Minimum de commande (€)"
              type="number"
              min={0}
              value={form.min_order}
              onChange={(e) => setForm({ ...form, min_order: e.target.value })}
            />
            <InputField
              label="Nombre max de gains"
              type="number"
              min={1}
              hint="vide = illimité"
              value={form.max_total_wins}
              onChange={(e) => setForm({ ...form, max_total_wins: e.target.value })}
            />
          </div>
          <TextareaField
            label="Conditions d'utilisation"
            rows={2}
            value={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.value })}
          />
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={saving} className="w-full">
            {editing ? 'Enregistrer les modifications' : 'Créer la campagne'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
