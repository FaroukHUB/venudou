import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useOrg } from '@/lib/org-context';
import type { OrgRole } from '@/lib/types';
import { PageHeader, Spinner, Badge } from '@/components/ui/misc';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField } from '@/components/ui/Field';

interface MemberRow {
  id: string;
  role: OrgRole;
  user_id: string;
  profile: { full_name: string | null } | null;
}

const ROLE_LABELS: Record<OrgRole, string> = {
  organization_owner: 'Propriétaire',
  organization_admin: 'Administrateur',
  location_manager: "Responsable d'établissement",
};

export default function Equipe() {
  const { user } = useAuth();
  const { current, isAdmin } = useOrg();
  const orgId = current?.organization.id;
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('location_manager');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!orgId) return;
    supabase
      .from('organization_members')
      .select('id, role, user_id, profile:profiles(full_name)')
      .eq('organization_id', orgId)
      .then(({ data }) => setMembers((data ?? []) as unknown as MemberRow[]));
  }, [orgId]);

  useEffect(load, [load]);

  async function invite(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setMessage(null);
    const { data, error } = await supabase.rpc('add_member_by_email', {
      p_org: orgId,
      p_email: email,
      p_role: role,
    });
    setSaving(false);
    const res = data as { ok: boolean; error?: string } | null;
    if (error) {
      setMessage(error.message);
    } else if (!res?.ok) {
      setMessage(
        res?.error === 'USER_NOT_FOUND'
          ? "Aucun compte VenuD'où n'existe avec cet e-mail. Demandez à la personne de créer d'abord son compte sur la page d'inscription."
          : (res?.error ?? 'Erreur'),
      );
    } else {
      setModalOpen(false);
      setEmail('');
      load();
    }
  }

  async function changeRole(m: MemberRow, next: OrgRole) {
    await supabase.from('organization_members').update({ role: next }).eq('id', m.id);
    load();
  }

  async function remove(m: MemberRow) {
    await supabase.from('organization_members').delete().eq('id', m.id);
    load();
  }

  if (!members) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Équipe"
        description="Gérez les accès à votre organisation. Les responsables d'établissement ne voient que leurs établissements."
        actions={
          isAdmin && (
            <Button onClick={() => setModalOpen(true)}>
              <UserPlus className="size-4" aria-hidden /> Ajouter un membre
            </Button>
          )
        }
      />
      <Card>
        <ul className="divide-y divide-navy-50">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-navy-800">
                  {m.profile?.full_name || 'Utilisateur'}
                  {m.user_id === user?.id && <span className="ml-2 text-xs text-navy-400">(vous)</span>}
                </p>
                <Badge tone={m.role === 'organization_owner' ? 'turquoise' : 'navy'}>
                  {ROLE_LABELS[m.role]}
                </Badge>
              </div>
              {isAdmin && m.user_id !== user?.id && (
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border border-navy-200 px-2 py-1.5 text-sm"
                    value={m.role}
                    aria-label={`Rôle de ${m.profile?.full_name ?? 'ce membre'}`}
                    onChange={(e) => void changeRole(m, e.target.value as OrgRole)}
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => void remove(m)}>
                    Retirer
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ajouter un membre">
        <form onSubmit={invite} className="space-y-4">
          <InputField
            label="Adresse e-mail du membre"
            type="email"
            required
            hint="La personne doit déjà avoir un compte VenuD'où."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <SelectField label="Rôle" value={role} onChange={(e) => setRole(e.target.value as OrgRole)}>
            <option value="organization_admin">Administrateur</option>
            <option value="location_manager">Responsable d'établissement</option>
          </SelectField>
          {message && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {message}
            </p>
          )}
          <Button type="submit" loading={saving} className="w-full">
            Ajouter
          </Button>
        </form>
      </Modal>
    </div>
  );
}
