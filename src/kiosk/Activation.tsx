import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Tablet } from 'lucide-react';
import { activateDevice, fetchKioskConfig } from '@/lib/kiosk/api';
import { getDeviceToken, saveDeviceToken } from '@/lib/kiosk/storage';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

/** Première installation d'une tablette : saisie du code d'activation. */
export default function Activation() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Service worker du kiosque (hors ligne)
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/kiosk-sw.js');
    }
    // Tablette déjà activée → directement le questionnaire
    void getDeviceToken().then((token) => {
      if (token) {
        navigate('/kiosk/session', { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { deviceToken } = await activateDevice(code.trim().toUpperCase());
      await saveDeviceToken(deviceToken);
      await fetchKioskConfig();
      navigate('/kiosk/session', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(
        message === 'INVALID_OR_EXPIRED_CODE'
          ? 'Code invalide ou expiré. Générez un nouveau code depuis le tableau de bord.'
          : 'Activation impossible. Vérifiez la connexion Internet et réessayez.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  return (
    <main className="kiosk-screen flex min-h-screen flex-col items-center justify-center bg-navy-900 px-6 text-white">
      <Logo className="mb-8 brightness-0 invert" />
      <div className="w-full max-w-md rounded-3xl bg-white/5 p-8 text-center">
        <Tablet className="mx-auto mb-4 size-10 text-turquoise-300" aria-hidden />
        <h1 className="text-2xl font-bold">Activer cette tablette</h1>
        <p className="mt-2 text-sm text-navy-100">
          Saisissez le code d'activation généré depuis votre tableau de bord VenuD'où (Tablettes →
          Code d'activation).
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            className="w-full rounded-2xl border-2 border-white/20 bg-white/10 px-4 py-4 text-center font-mono text-3xl tracking-[0.4em] uppercase placeholder:text-white/30 focus:border-turquoise-300"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            autoFocus
            aria-label="Code d'activation"
            inputMode="text"
            autoComplete="off"
          />
          {error && (
            <p className="text-sm font-medium text-red-300" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="secondary"
            size="kiosk"
            className="w-full"
            loading={loading}
          >
            Activer
          </Button>
        </form>
      </div>
    </main>
  );
}
