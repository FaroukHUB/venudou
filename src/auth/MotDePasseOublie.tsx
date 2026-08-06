import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { supabase } from '@/lib/supabase';
import { AuthShell } from './AuthShell';
import { InputField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // E-mail envoyé via Supabase Auth (SMTP Brevo configuré côté dashboard).
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/connexion`,
    });
    setLoading(false);
    setSent(true); // même message que l'e-mail existe ou non (pas d'énumération)
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      footer={
        <Link to="/connexion" className="font-semibold text-turquoise-600 hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-navy-600">
          Si un compte existe pour <strong>{email}</strong>, un e-mail de réinitialisation vient
          d'être envoyé.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <InputField
            label="Adresse e-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Envoyer le lien de réinitialisation
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
