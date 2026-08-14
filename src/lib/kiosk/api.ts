import type { KioskConfig, KioskReward, PendingKioskSession } from '@/lib/types';
import {
  enqueueSession,
  getDeviceToken,
  pendingSessions,
  removePendingSession,
  saveConfig,
} from './storage';

/** Client API du kiosque — parle au Worker (jamais à Supabase directement). */

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getDeviceToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP_${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Vrai si le serveur a explicitement rejeté le jeton de cette tablette
 * (appareil supprimé ou base changée). Une panne réseau, un rate limit ou
 * une suspension d'organisation ne comptent pas : la tablette doit alors
 * continuer sur son cache, pas se désactiver.
 */
export function isDeviceRejected(err: unknown): boolean {
  return err instanceof Error && err.message === 'DEVICE_NOT_FOUND';
}

export async function activateDevice(code: string): Promise<{ deviceToken: string }> {
  return api<{ deviceToken: string }>('/api/kiosk/activate', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function fetchKioskConfig(): Promise<KioskConfig> {
  const config = await api<KioskConfig>('/api/kiosk/config');
  await saveConfig(config);
  return config;
}

export interface SubmitResult {
  duplicate: boolean;
  reward: KioskReward | null;
}

export async function submitSession(session: PendingKioskSession): Promise<SubmitResult> {
  return api<SubmitResult>('/api/kiosk/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
}

export async function sendReviewEvent(
  eventType: 'prompt_shown' | 'accepted' | 'declined' | 'qr_displayed',
  clientSessionId?: string,
): Promise<void> {
  try {
    await api('/api/kiosk/review-events', {
      method: 'POST',
      body: JSON.stringify({ eventType, clientSessionId }),
    });
  } catch {
    // hors ligne : événement non bloquant, volontairement perdu
  }
}

/**
 * Soumission avec repli hors ligne : la session est TOUJOURS mise en file
 * d'abord (IndexedDB), puis on tente l'envoi immédiat. En cas d'échec réseau,
 * elle sera synchronisée plus tard (idempotence garantie côté serveur).
 */
export async function submitOrQueue(session: PendingKioskSession): Promise<SubmitResult | null> {
  await enqueueSession(session);
  try {
    const result = await submitSession(session);
    await removePendingSession(session.clientSessionId);
    return result;
  } catch {
    return null; // restera en file, synchronisée par syncPending()
  }
}

/** Synchronise la file d'attente. Retourne le nombre de sessions envoyées. */
export async function syncPending(): Promise<number> {
  const pending = await pendingSessions();
  let sent = 0;
  for (const session of pending) {
    try {
      await submitSession(session);
      await removePendingSession(session.clientSessionId);
      sent += 1;
    } catch {
      break; // réseau indisponible : on réessaiera
    }
  }
  return sent;
}

let syncStarted = false;

/** Synchronisation automatique : au retour du réseau + toutes les 60 s. */
export function startAutoSync(): void {
  if (syncStarted) return;
  syncStarted = true;
  window.addEventListener('online', () => {
    void syncPending();
  });
  setInterval(() => {
    if (navigator.onLine) void syncPending();
  }, 60_000);
}
