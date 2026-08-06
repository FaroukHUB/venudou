import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/lib/org-context';
import { fetchDevices } from '../data';
import { isDeviceOnline, formatDateTime } from '@/lib/format';
import type { Device } from '@/lib/types';
import { PageHeader, EmptyState, Badge, Spinner } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField } from '@/components/ui/Field';

export default function Tablettes() {
  const { current, locations } = useOrg();
  const orgId = current?.organization.id;
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activationCode, setActivationCode] = useState<{ device: string; code: string } | null>(null);

  const load = useCallback(() => {
    if (!orgId) return;
    fetchDevices(orgId).then(setDevices).catch((e: Error) => setError(e.message));
  }, [orgId]);

  useEffect(load, [load]);

  async function createDevice(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('devices').insert({
      organization_id: orgId,
      location_id: locationId,
      name,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setModalOpen(false);
    setName('');
    load();
  }

  async function generateCode(device: Device) {
    setError(null);
    const { data, error: err } = await supabase.rpc('create_device_activation_code', {
      p_device: device.id,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setActivationCode({ device: device.name, code: data as string });
  }

  if (!devices) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Tablettes"
        description="Créez une tablette, générez son code d'activation, puis saisissez ce code sur la tablette à l'adresse /kiosk."
        actions={
          <Button onClick={() => setModalOpen(true)} disabled={locations.length === 0}>
            <Plus className="size-4" aria-hidden /> Nouvelle tablette
          </Button>
        }
      />
      {error && (
        <p className="mb-4 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
      {devices.length === 0 ? (
        <EmptyState
          title="Aucune tablette"
          description={
            locations.length === 0
              ? "Créez d'abord un établissement, puis ajoutez une tablette."
              : 'Ajoutez une tablette pour votre premier établissement.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((d) => (
            <Card key={d.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-navy-900">{d.name}</h2>
                  <p className="text-sm text-navy-500">
                    {locations.find((l) => l.id === d.location_id)?.name ?? '—'}
                  </p>
                </div>
                {d.status === 'pending' && <Badge tone="gray">À activer</Badge>}
                {d.status === 'disabled' && <Badge tone="red">Désactivée</Badge>}
                {d.status === 'active' &&
                  (isDeviceOnline(d.last_seen_at) ? (
                    <Badge tone="green">En ligne</Badge>
                  ) : (
                    <Badge tone="red">Hors ligne</Badge>
                  ))}
              </div>
              <p className="mt-2 text-xs text-navy-400">
                Dernière activité : {formatDateTime(d.last_seen_at)}
              </p>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => generateCode(d)}>
                <KeyRound className="size-4" aria-hidden />
                {d.status === 'pending' ? "Code d'activation" : 'Régénérer un code'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle tablette">
        <form onSubmit={createDevice} className="space-y-4">
          <InputField
            label="Nom de la tablette"
            placeholder="Ex. : Caisse principale"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <SelectField
            label="Établissement"
            required
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">Choisir…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </SelectField>
          <Button type="submit" loading={saving} className="w-full">
            Créer la tablette
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(activationCode)}
        onClose={() => setActivationCode(null)}
        title="Code d'activation"
      >
        {activationCode && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-navy-600">
              Sur la tablette « {activationCode.device} », ouvrez{' '}
              <strong>{window.location.origin}/kiosk</strong> puis saisissez :
            </p>
            <p className="rounded-2xl bg-navy-800 py-4 font-mono text-4xl font-bold tracking-[0.3em] text-turquoise-300">
              {activationCode.code}
            </p>
            <p className="text-xs text-navy-400">
              Code valable 15 minutes, à usage unique. Il ne sera plus affiché : générez-en un
              nouveau si besoin.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
