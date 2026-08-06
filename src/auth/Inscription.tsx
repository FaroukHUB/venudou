import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { AuthShell } from './AuthShell';
import { InputField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function Inscription() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (err) {
      setError(err.message === 'User already registered' ? 'Un compte existe déjà avec cet e-mail.' : err.message);
      return;
    }
    // Selon la configuration Supabase : session immédiate ou confirmation e-mail (SMTP Brevo).
    if (data.session) {
      navigate('/bienvenue', { replace: true });
    } else {
      setEmailSent(true);
    }
  }

  if (emailSent) {
    return (
      <AuthShell title="Vérifiez votre boîte mail">
        <p className="text-sm text-navy-600">
          Un e-mail de confirmation vient de vous être envoyé à <strong>{email}</strong>. Cliquez
          sur le lien pour activer votre compte, puis connectez-vous.
        </p>
        <Link to="/connexion" className="mt-4 inline-block font-semibold text-turquoise-600 hover:underline">
          Aller à la connexion
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Créer un compte"
      footer={
        <p>
          Déjà un compte ?{' '}
          <Link to="/connexion" className="font-semibold text-turquoise-600 hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <InputField
          label="Votre nom"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          hint="8 caractères minimum"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Créer mon compte
        </Button>
      </form>
    </AuthShell>
  );
}
