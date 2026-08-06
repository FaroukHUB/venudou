import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import QRCode from 'qrcode';
import { ChevronRight, Gift, PartyPopper, Star, WifiOff } from 'lucide-react';
import type {
  KioskAnswer,
  KioskConfig,
  KioskOption,
  KioskQuestion,
  KioskReward,
} from '@/lib/types';
import { fetchKioskConfig, sendReviewEvent, startAutoSync, submitOrQueue } from '@/lib/kiosk/api';
import { getCachedConfig, getDeviceToken, pendingCount } from '@/lib/kiosk/storage';
import { iconFor } from '@/lib/icons';
import { brandIconFor } from '@/lib/brand-icons';
import { isDarkColor } from '@/lib/format';

type Phase =
  | { name: 'question'; index: number }
  | { name: 'free-text'; index: number; option: KioskOption }
  | { name: 'submitting' }
  | { name: 'reward'; reward: KioskReward }
  | { name: 'review-prompt' }
  | { name: 'review-qr' }
  | { name: 'thanks' };

const RESET_DELAY_MS = 7000;
const QR_DELAY_MS = 45000;

export default function Session() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: 'question', index: 0 });
  const [answers, setAnswers] = useState<KioskAnswer[]>([]);
  const [startedAt, setStartedAt] = useState<string>(new Date().toISOString());
  const [clientSessionId, setClientSessionId] = useState<string>(() => crypto.randomUUID());
  const [freeText, setFreeText] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [queued, setQueued] = useState(0);
  const lockRef = useRef(false); // anti double-clic
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement de la configuration : réseau d'abord, cache IndexedDB en secours.
  useEffect(() => {
    startAutoSync();
    void (async () => {
      const token = await getDeviceToken();
      if (!token) {
        navigate('/kiosk', { replace: true });
        return;
      }
      try {
        setConfig(await fetchKioskConfig());
      } catch {
        const cached = await getCachedConfig();
        if (cached) setConfig(cached);
        else navigate('/kiosk', { replace: true });
      }
      setQueued(await pendingCount());
    })();
  }, [navigate]);

  // Rafraîchit la configuration (et le statut en ligne) toutes les 2 minutes.
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchKioskConfig()
          .then(setConfig)
          .catch(() => undefined);
      }
      void pendingCount().then(setQueued);
    }, 120_000);
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const questions: KioskQuestion[] = config?.questionnaire.questions ?? [];

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnswers([]);
    setFreeText('');
    setQrDataUrl(null);
    setClientSessionId(crypto.randomUUID());
    setStartedAt(new Date().toISOString());
    lockRef.current = false;
    setPhase({ name: 'question', index: 0 });
  }, []);

  const scheduleReset = useCallback(
    (delay: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(reset, delay);
    },
    [reset],
  );

  const finishSession = useCallback(
    async (finalAnswers: KioskAnswer[]) => {
      setPhase({ name: 'submitting' });
      const result = await submitOrQueue({
        clientSessionId,
        startedAt,
        completedAt: new Date().toISOString(),
        answers: finalAnswers,
      });
      setQueued(await pendingCount());
      if (result?.reward) {
        setPhase({ name: 'reward', reward: result.reward });
        return;
      }
      if (config?.review.active && config.review.trackingCode) {
        void sendReviewEvent('prompt_shown', clientSessionId);
        setPhase({ name: 'review-prompt' });
      } else {
        setPhase({ name: 'thanks' });
        scheduleReset(RESET_DELAY_MS);
      }
    },
    [clientSessionId, startedAt, config, scheduleReset],
  );

  const advance = useCallback(
    (nextAnswers: KioskAnswer[], fromIndex: number) => {
      const nextIndex = fromIndex + 1;
      setAnswers(nextAnswers);
      if (nextIndex >= questions.length) {
        void finishSession(nextAnswers);
      } else {
        lockRef.current = false;
        setPhase({ name: 'question', index: nextIndex });
      }
    },
    [questions.length, finishSession],
  );

  function selectOption(question: KioskQuestion, option: KioskOption, index: number) {
    if (lockRef.current) return; // blocage des doubles clics
    lockRef.current = true;
    if (option.isOther && question.allowFreeText) {
      setPhase({ name: 'free-text', index, option });
      lockRef.current = false;
      return;
    }
    advance([...answers, { questionId: question.id, optionId: option.id }], index);
  }

  function skip(_question: KioskQuestion, index: number) {
    if (lockRef.current) return;
    lockRef.current = true;
    advance(answers, index);
  }

  // Écran QR d'avis
  useEffect(() => {
    if (phase.name !== 'review-qr' || !config?.review.trackingCode) return;
    const url = `${window.location.origin}/r/${config.review.trackingCode}?s=${clientSessionId}`;
    void QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQrDataUrl);
    void sendReviewEvent('qr_displayed', clientSessionId);
    scheduleReset(QR_DELAY_MS);
  }, [phase.name, config, clientSessionId, scheduleReset]);

  if (!config) {
    return (
      <main className="kiosk-screen flex min-h-screen items-center justify-center bg-navy-900 text-white">
        <p className="text-xl">Chargement…</p>
      </main>
    );
  }

  // Thème par établissement : fond, forme des boutons, logo
  const theme = config.questionnaire.theme ?? {};
  const bgStyle = theme.backgroundColor ? { backgroundColor: theme.backgroundColor } : undefined;
  const dark = isDarkColor(theme.backgroundColor, true);
  const textMain = dark ? 'text-white' : 'text-navy-900';
  const textSub = dark ? 'text-navy-100' : 'text-navy-600';
  const accentText = dark ? 'text-turquoise-300' : 'text-turquoise-600';
  const buttonBase = dark
    ? 'bg-white/10 text-white hover:bg-turquoise-500'
    : 'bg-navy-900/5 text-navy-900 hover:bg-turquoise-500 hover:text-white';
  const shape = theme.buttonShape === 'round' ? 'rounded-full' : 'rounded-2xl';
  const logo = theme.logoUrl ? (
    <img
      src={theme.logoUrl}
      alt=""
      className="mx-auto mb-3 h-14 w-auto max-w-[220px] object-contain"
    />
  ) : null;

  const offlineBanner = (offline || queued > 0) && (
    <p className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-navy-100">
      <WifiOff className="size-3.5" aria-hidden />
      {offline
        ? 'Hors ligne — vos réponses sont conservées'
        : `${queued} réponse(s) à synchroniser`}
    </p>
  );

  // --- Écrans ---

  if (phase.name === 'question' || phase.name === 'free-text') {
    const index = phase.index;
    const question = questions[index];
    if (!question) return null;
    return (
      <main
        className={`kiosk-screen relative flex min-h-screen flex-col bg-navy-900 px-6 py-8 ${textMain}`}
        style={bgStyle}
      >
        {offlineBanner}
        {logo}
        <p className={`text-center text-lg font-semibold ${accentText}`}>
          {index + 1}/{questions.length}
        </p>
        <div
          className="animate-step mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center"
          key={`${phase.name}-${index}`}
        >
          <h1 className={`text-center text-3xl font-bold sm:text-4xl ${textMain}`}>
            {question.label}
          </h1>

          {phase.name === 'question' ? (
            <>
              <div
                className={`mt-10 grid gap-4 ${question.options.length > 4 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}
              >
                {question.options.map((option) => {
                  const Brand = brandIconFor(option.value, option.icon);
                  const Icon = Brand ? null : iconFor(option.icon);
                  return (
                    <button
                      key={option.id}
                      onClick={() => selectOption(question, option, index)}
                      className={`flex min-h-[80px] items-center justify-center gap-3 px-6 py-5 text-xl font-semibold transition-colors active:bg-turquoise-600 ${shape} ${buttonBase}`}
                    >
                      {Brand && (
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                          <Brand className="size-7" />
                        </span>
                      )}
                      {Icon && (
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${dark ? 'bg-white/15' : 'bg-navy-900/10'}`}
                        >
                          <Icon className="size-6" aria-hidden />
                        </span>
                      )}
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {!question.required && (
                <button
                  onClick={() => skip(question, index)}
                  className={`mx-auto mt-8 flex items-center gap-1 rounded-xl px-6 py-3 text-lg ${textSub} hover:opacity-70`}
                >
                  Passer cette question <ChevronRight className="size-5" aria-hidden />
                </button>
              )}
            </>
          ) : (
            <div className="mx-auto mt-10 w-full max-w-xl space-y-5">
              <label className={`block text-center text-lg ${textSub}`} htmlFor="kiosk-free-text">
                Précisez si vous le souhaitez (facultatif)
              </label>
              <input
                id="kiosk-free-text"
                className={`w-full rounded-2xl border-2 px-5 py-4 text-xl focus:border-turquoise-400 ${dark ? 'border-white/20 bg-white/10 placeholder:text-white/30' : 'border-navy-200 bg-white placeholder:text-navy-300'}`}
                value={freeText}
                maxLength={200}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Ex. : un ami, une affiche…"
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() =>
                    advance(
                      [...answers, { questionId: question.id, optionId: phase.option.id }],
                      index,
                    )
                  }
                  className="rounded-2xl bg-white/10 py-4 text-lg font-semibold hover:bg-white/20"
                >
                  Passer
                </button>
                <button
                  onClick={() =>
                    advance(
                      [
                        ...answers,
                        {
                          questionId: question.id,
                          optionId: phase.option.id,
                          freeText: freeText.trim() || undefined,
                        },
                      ],
                      index,
                    )
                  }
                  className="rounded-2xl bg-turquoise-500 py-4 text-lg font-bold hover:bg-turquoise-600"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (phase.name === 'submitting') {
    return (
      <main className="kiosk-screen flex min-h-screen items-center justify-center bg-navy-900 text-white">
        <p className="animate-step text-2xl">Merci !</p>
      </main>
    );
  }

  if (phase.name === 'reward') {
    return (
      <main
        className={`kiosk-screen animate-step flex min-h-screen flex-col items-center justify-center bg-navy-900 px-6 text-center ${textMain}`}
        style={bgStyle}
      >
        <PartyPopper className="size-16 text-turquoise-300" aria-hidden />
        <h1 className="mt-4 text-4xl font-bold">Félicitations, vous avez gagné !</h1>
        <p className="mt-3 text-2xl text-turquoise-200">{phase.reward.label}</p>
        <p className="mt-6 rounded-2xl bg-white px-8 py-4 font-mono text-4xl font-bold tracking-widest text-navy-900">
          {phase.reward.code}
        </p>
        <p className={`mt-4 max-w-md ${textSub}`}>
          Photographiez ce code et présentez-le en caisse.
          {phase.reward.terms && ` ${phase.reward.terms}`}
        </p>
        <button
          onClick={() => {
            if (config.review.active && config.review.trackingCode) {
              void sendReviewEvent('prompt_shown', clientSessionId);
              setPhase({ name: 'review-prompt' });
            } else {
              setPhase({ name: 'thanks' });
              scheduleReset(RESET_DELAY_MS);
            }
          }}
          className={`mt-8 bg-turquoise-500 px-10 py-5 text-2xl font-bold text-white hover:bg-turquoise-600 ${shape}`}
        >
          Continuer
        </button>
      </main>
    );
  }

  if (phase.name === 'review-prompt') {
    return (
      <main
        className={`kiosk-screen animate-step flex min-h-screen flex-col items-center justify-center bg-navy-900 px-6 text-center ${textMain}`}
        style={bgStyle}
      >
        <Star className="size-14 text-turquoise-300" aria-hidden />
        <h1 className="mt-4 max-w-2xl text-3xl font-bold sm:text-4xl">
          Souhaitez-vous laisser un avis sur votre expérience ?
        </h1>
        <div className="mt-10 grid w-full max-w-xl grid-cols-2 gap-5">
          <button
            onClick={() => {
              void sendReviewEvent('declined', clientSessionId);
              setPhase({ name: 'thanks' });
              scheduleReset(RESET_DELAY_MS);
            }}
            className={`py-6 text-2xl font-semibold ${shape} ${dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-navy-900/5 text-navy-900 hover:bg-navy-900/10'}`}
          >
            Non merci
          </button>
          <button
            onClick={() => {
              void sendReviewEvent('accepted', clientSessionId);
              setPhase({ name: 'review-qr' });
            }}
            className={`bg-turquoise-500 py-6 text-2xl font-bold text-white hover:bg-turquoise-600 ${shape}`}
          >
            Oui, volontiers
          </button>
        </div>
      </main>
    );
  }

  if (phase.name === 'review-qr') {
    return (
      <main
        className={`kiosk-screen animate-step flex min-h-screen flex-col items-center justify-center bg-navy-900 px-6 text-center ${textMain}`}
        style={bgStyle}
      >
        <h1 className="text-3xl font-bold">Scannez ce QR code avec votre téléphone</h1>
        <p className="mt-2 text-navy-100">
          Vous serez redirigé vers la page d'avis de l'établissement.
        </p>
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR code vers la page d'avis"
            width={320}
            height={320}
            className="mt-8 rounded-3xl bg-white p-4"
          />
        )}
        <button
          onClick={() => {
            setPhase({ name: 'thanks' });
            scheduleReset(RESET_DELAY_MS);
          }}
          className={`mt-8 px-10 py-4 text-xl font-semibold ${shape} ${dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-navy-900/5 text-navy-900 hover:bg-navy-900/10'}`}
        >
          Terminé
        </button>
      </main>
    );
  }

  // thanks
  return (
    <main
      className={`kiosk-screen animate-step flex min-h-screen flex-col items-center justify-center bg-navy-900 px-6 text-center ${textMain}`}
      style={bgStyle}
    >
      <Gift className="size-14 text-turquoise-300" aria-hidden />
      <h1 className="mt-4 text-4xl font-bold">Merci pour votre réponse !</h1>
      <p className={`mt-3 text-xl ${textSub}`}>Belle journée à vous.</p>
    </main>
  );
}
