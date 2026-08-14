import { openDB, type IDBPDatabase } from 'idb';
import type { KioskConfig, PendingKioskSession } from '@/lib/types';

/**
 * Stockage local du kiosque :
 *  - jeton d'appareil + configuration en cache (fonctionnement hors ligne) ;
 *  - file `pending_sessions` des réponses en attente de synchronisation.
 */

const DB_NAME = 'venudou-kiosk';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('meta')) {
          database.createObjectStore('meta');
        }
        if (!database.objectStoreNames.contains('pending_sessions')) {
          database.createObjectStore('pending_sessions', { keyPath: 'clientSessionId' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveDeviceToken(token: string): Promise<void> {
  await (await db()).put('meta', token, 'deviceToken');
}

export async function getDeviceToken(): Promise<string | null> {
  return ((await (await db()).get('meta', 'deviceToken')) as string | undefined) ?? null;
}

export async function clearDevice(): Promise<void> {
  const d = await db();
  await d.delete('meta', 'deviceToken');
  await d.delete('meta', 'config');
  // Les sessions en attente appartiennent à l'appareil désactivé : on les
  // vide aussi, sinon elles seraient rejouées sous une autre identité.
  await d.clear('pending_sessions');
}

export async function saveConfig(config: KioskConfig): Promise<void> {
  await (await db()).put('meta', config, 'config');
}

export async function getCachedConfig(): Promise<KioskConfig | null> {
  return ((await (await db()).get('meta', 'config')) as KioskConfig | undefined) ?? null;
}

export async function enqueueSession(session: PendingKioskSession): Promise<void> {
  await (await db()).put('pending_sessions', session);
}

export async function pendingSessions(): Promise<PendingKioskSession[]> {
  return (await (await db()).getAll('pending_sessions')) as PendingKioskSession[];
}

export async function removePendingSession(clientSessionId: string): Promise<void> {
  await (await db()).delete('pending_sessions', clientSessionId);
}

export async function pendingCount(): Promise<number> {
  return (await db()).count('pending_sessions');
}
