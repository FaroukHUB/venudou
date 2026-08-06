import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/lib/org-context';
import { slugify } from '@/lib/format';
import { AuthShell } from './AuthShell';
import { InputField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

/** Création de la première organisation après inscription. */
export default function Onboarding() {
  const navigate = useNavigate();
  const { memberships, refresh } = useOrg();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error: err } = await supabase.rpc('create_organization_with_owner', {
      p_name: name,
      p_slug: slug,
    });
    setLoading(false);
    if (err) {
      setError("Impossible de créer l'organisation : " + err.message);
      return;
    }
    await refresh();
    navigate('/app', { replace: true });
  }

  return (
    <AuthShell title="Bienvenue sur VenuD'où">
      <p className="mb-4 text-sm text-navy-600">
        Créez votre organisation pour commencer. Vous pourrez ensuite ajouter vos établissements et
        vos tablettes.
      </p>
      {memberships.length > 0 && (
        <p className="mb-4 text-sm text-navy-500">
          Vous appartenez déjà à une organisation —{' '}
          <button className="font-semibold text-turquoise-600 hover:underline" onClick={() => navigate('/app')}>
            accéder au tableau de bord
          </button>
          .
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <InputField
          label="Nom de votre entreprise"
          placeholder="Ex. : Trust Industrie"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Créer mon organisation
        </Button>
      </form>
    </AuthShell>
  );
}
