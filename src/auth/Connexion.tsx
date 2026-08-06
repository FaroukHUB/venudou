import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { AuthShell } from './AuthShell';
import { InputField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function Connexion() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError('E-mail ou mot de passe incorrect.');
      return;
    }
    navigate(location.state?.from ?? '/app', { replace: true });
  }

  return (
    <AuthShell
      title="Connexion"
      footer={
        <p>
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-semibold text-turquoise-600 hover:underline">
            Créer un compte
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <InputField
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputField
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Se connecter
        </Button>
        <p className="text-center text-sm">
          <Link to="/mot-de-passe-oublie" className="text-navy-500 hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
