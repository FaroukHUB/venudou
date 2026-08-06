import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/lib/org-context';
import { slugify } from '@/lib/format';
import { PageHeader, EmptyState, Badge } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/Field';
import type { Location } from '@/lib/types';

export default function Etablissements() {
  const { current, locations, locationLimit, isAdmin, refresh } = useOrg();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState({ name: '', address_line: '', postal_code: '', city: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const limitReached = locationLimit !== null && locations.length >= locationLimit;

  function openCreate() {
    setEditing(null);
    setForm({ name: '', address_line: '', postal_code: '', city: '' });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(loc: Location) {
    setEditing(loc);
    setForm({
      name: loc.name,
      address_line: loc.address_line,
      postal_code: loc.postal_code,
      city: loc.city,
    });
    setError(null);
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!current) return;
    setSaving(true);
    setError(null);
    if (editing) {
      const { error: err } = await supabase
        .from('locations')
        .update({ ...form })
        .eq('id', editing.id);
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.from('locations').insert({
        organization_id: current.organization.id,
        slug: `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`,
        ...form,
      });
      if (err) {
        setError(
          err.message.includes('LOCATION_LIMIT_REACHED')
            ? `Limite atteinte : votre offre autorise ${locationLimit} établissement${(locationLimit ?? 0) > 1 ? 's' : ''}. Contactez-nous pour passer à l'offre supérieure.`
            : err.message,
        );
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    if (!error) {
      setModalOpen(false);
      await refresh();
    }
  }

  return (
    <div>
      <PageHeader
        title="Établissements"
        description={
          locationLimit !== null
            ? `${locations.length} / ${locationLimit} établissement${locationLimit > 1 ? 's' : ''} de votre offre`
            : `${locations.length} établissement(s) — offre sur mesure`
        }
        actions={
          isAdmin && (
            <Button onClick={openCreate} disabled={limitReached} title={limitReached ? 'Limite de votre offre atteinte' : undefined}>
              <Plus className="size-4" aria-hidden /> Ajouter un établissement
            </Button>
          )
        }
      />
      {limitReached && (
        <p className="mb-4 rounded-xl bg-navy-50 px-4 py-3 text-sm text-navy-700">
          Vous avez atteint la limite d'établissements de votre offre. Rendez-vous dans{' '}
          <a href="/app/abonnement" className="font-semibold text-turquoise-600 hover:underline">
            Abonnement
          </a>{' '}
          pour en ajouter davantage.
        </p>
      )}
      {locations.length === 0 ? (
        <EmptyState
          title="Aucun établissement"
          description="Créez votre premier établissement pour installer une tablette et commencer à collecter des réponses."
          action={isAdmin && <Button onClick={openCreate}>Créer un établissement</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <div className="flex items-start justify-between">
                <h2 className="font-bold text-navy-900">{loc.name}</h2>
                <Badge tone="turquoise">Actif</Badge>
              </div>
              <p className="mt-1 text-sm text-navy-500">
                {[loc.address_line, [loc.postal_code, loc.city].filter(Boolean).join(' ')]
                  .filter(Boolean)
                  .join(', ') || 'Adresse non renseignée'}
              </p>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="mt-4" onClick={() => openEdit(loc)}>
                  Modifier
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier l'établissement" : 'Nouvel établissement'}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <InputField
            label="Nom de l'établissement"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <InputField
            label="Adresse"
            value={form.address_line}
            onChange={(e) => setForm({ ...form, address_line: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Code postal"
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
            />
            <InputField
              label="Ville"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={saving} className="w-full">
            {editing ? 'Enregistrer' : "Créer l'établissement"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
