import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  enqueueSession,
  pendingCount,
  pendingSessions,
  removePendingSession,
  saveDeviceToken,
} from '@/lib/kiosk/storage';
import { submitOrQueue, syncPending } from '@/lib/kiosk/api';
import type { PendingKioskSession } from '@/lib/types';

function makeSession(id: string): PendingKioskSession {
  return {
    clientSessionId: id,
    startedAt: '2026-08-06T10:00:00.000Z',
    completedAt: '2026-08-06T10:00:12.000Z',
    answers: [{ questionId: '5f0e88a6-0000-4000-8000-000000000001' }],
  };
}

describe('file hors ligne du kiosque', () => {
  beforeEach(async () => {
    await saveDeviceToken('jeton-de-test-suffisamment-long-0123456789');
    for (const s of await pendingSessions()) {
      await removePendingSession(s.clientSessionId);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enqueue/remove : la file IndexedDB est persistante et idempotente', async () => {
    await enqueueSession(makeSession('11111111-1111-4111-8111-111111111111'));
    await enqueueSession(makeSession('11111111-1111-4111-8111-111111111111')); // même clé
    await enqueueSession(makeSession('22222222-2222-4222-8222-222222222222'));
    expect(await pendingCount()).toBe(2);
    await removePendingSession('11111111-1111-4111-8111-111111111111');
    expect(await pendingCount()).toBe(1);
  });

  it('hors ligne : la session reste en file quand le réseau échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const result = await submitOrQueue(makeSession('33333333-3333-4333-8333-333333333333'));
    expect(result).toBeNull();
    expect(await pendingCount()).toBe(1);
  });

  it('retour du réseau : syncPending envoie et vide la file (doublons ignorés côté serveur)', async () => {
    await enqueueSession(makeSession('44444444-4444-4444-8444-444444444444'));
    await enqueueSession(makeSession('55555555-5555-4555-8555-555555555555'));
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ duplicate: true, reward: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const sent = await syncPending();
    expect(sent).toBe(2);
    expect(await pendingCount()).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Le jeton d'appareil est bien transmis en Bearer
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Bearer /);
  });

  it('en cas de succès direct, la session ne reste pas en file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ duplicate: false, reward: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const result = await submitOrQueue(makeSession('66666666-6666-4666-8666-666666666666'));
    expect(result).toEqual({ duplicate: false, reward: null });
    expect(await pendingCount()).toBe(0);
  });
});
