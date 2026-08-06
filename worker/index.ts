import { Hono } from 'hono';
import { z } from 'zod';
import { rateLimit, randomToken, serviceClient, sha256Hex, type Env } from './lib';

const app = new Hono<{ Bindings: Env }>();

// Erreur inattendue (ex. secrets Supabase absents) : réponse propre, sans fuite.
app.onError((err, c) => {
  console.error('worker error:', err.message);
  return c.json({ error: 'SERVICE_UNAVAILABLE' }, 503);
});

// ------------------------------------------------------------
// Schémas Zod : toutes les entrées kiosque sont validées ici.
// ------------------------------------------------------------

const activateSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,10}$/),
});

const answerSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  freeText: z.string().max(200).optional(),
});

const sessionSchema = z.object({
  clientSessionId: z.string().uuid(),
  startedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  completedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  answers: z.array(answerSchema).max(30),
});

const reviewEventSchema = z.object({
  eventType: z.enum(['prompt_shown', 'accepted', 'declined', 'qr_displayed']),
  clientSessionId: z.string().uuid().optional(),
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function bearerTokenHash(c: { req: { header: (name: string) => string | undefined } }) {
  const auth = c.req.header('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token.length < 20) return null;
  return sha256Hex(token);
}

function clientKey(c: { req: { header: (name: string) => string | undefined } }, fallback: string) {
  // Clé de rate limiting éphémère (jamais persistée, aucune IP stockée en base).
  return c.req.header('CF-Connecting-IP') ?? fallback;
}

// ------------------------------------------------------------
// API kiosque
// ------------------------------------------------------------

app.post('/api/kiosk/activate', async (c) => {
  if (!rateLimit(`activate:${clientKey(c, 'anon')}`, 10, 60_000)) {
    return c.json({ error: 'RATE_LIMITED' }, 429);
  }
  const parsed = activateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'INVALID_INPUT' }, 400);

  const token = randomToken(32);
  const supabase = serviceClient(c.env);
  const { data, error } = await supabase.rpc('activate_device', {
    p_code_hash: await sha256Hex(parsed.data.code),
    p_token_hash: await sha256Hex(token),
  });
  if (error) return c.json({ error: 'SERVER_ERROR' }, 500);
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) return c.json({ error: result.error ?? 'INVALID_OR_EXPIRED_CODE' }, 400);

  // Le jeton en clair n'est renvoyé qu'une seule fois, à la tablette.
  return c.json({ deviceToken: token, ...result });
});

app.get('/api/kiosk/config', async (c) => {
  const tokenHash = await bearerTokenHash(c);
  if (!tokenHash) return c.json({ error: 'UNAUTHORIZED' }, 401);
  if (!rateLimit(`config:${tokenHash}`, 30, 60_000)) return c.json({ error: 'RATE_LIMITED' }, 429);

  const supabase = serviceClient(c.env);
  const { data, error } = await supabase.rpc('get_kiosk_config', { p_token_hash: tokenHash });
  if (error) return c.json({ error: 'SERVER_ERROR' }, 500);
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) return c.json({ error: result.error ?? 'DEVICE_NOT_FOUND' }, 401);
  return c.json(result);
});

app.post('/api/kiosk/sessions', async (c) => {
  const tokenHash = await bearerTokenHash(c);
  if (!tokenHash) return c.json({ error: 'UNAUTHORIZED' }, 401);
  // Limite volontairement large : la synchro hors ligne peut envoyer un lot.
  if (!rateLimit(`sessions:${tokenHash}`, 60, 60_000))
    return c.json({ error: 'RATE_LIMITED' }, 429);

  const parsed = sessionSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'INVALID_INPUT' }, 400);

  const supabase = serviceClient(c.env);
  const { data, error } = await supabase.rpc('process_survey_submission', {
    p_token_hash: tokenHash,
    p_client_session_id: parsed.data.clientSessionId,
    p_started_at: parsed.data.startedAt,
    p_completed_at: parsed.data.completedAt,
    p_answers: parsed.data.answers,
  });
  if (error) return c.json({ error: 'SERVER_ERROR' }, 500);
  const result = data as { ok: boolean; error?: string; duplicate?: boolean; reward?: unknown };
  if (!result.ok) return c.json({ error: result.error ?? 'DEVICE_NOT_FOUND' }, 401);
  return c.json({ duplicate: result.duplicate ?? false, reward: result.reward ?? null });
});

app.post('/api/kiosk/review-events', async (c) => {
  const tokenHash = await bearerTokenHash(c);
  if (!tokenHash) return c.json({ error: 'UNAUTHORIZED' }, 401);
  if (!rateLimit(`review:${tokenHash}`, 60, 60_000)) return c.json({ error: 'RATE_LIMITED' }, 429);

  const parsed = reviewEventSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'INVALID_INPUT' }, 400);

  const supabase = serviceClient(c.env);
  const { data, error } = await supabase.rpc('record_review_event', {
    p_token_hash: tokenHash,
    p_event_type: parsed.data.eventType,
    p_client_session_id: parsed.data.clientSessionId ?? null,
  });
  if (error) return c.json({ error: 'SERVER_ERROR' }, 500);
  const result = data as { ok: boolean };
  return c.json(result, result.ok ? 200 : 400);
});

// ------------------------------------------------------------
// /r/:trackingCode — suivi puis redirection vers le lien d'avis
// ------------------------------------------------------------

app.get('/r/:code', async (c) => {
  const code = c.req.param('code');
  if (!/^[a-z0-9]{4,16}$/i.test(code)) return notFound(c.env, c.req.raw);
  if (!rateLimit(`redirect:${clientKey(c, code)}`, 30, 60_000)) {
    return c.text('Trop de requêtes', 429);
  }
  const sessionParam = c.req.query('s');
  const clientSessionId =
    sessionParam && /^[0-9a-f-]{36}$/i.test(sessionParam) ? sessionParam : null;

  const supabase = serviceClient(c.env);
  const { data, error } = await supabase.rpc('resolve_review_redirect', {
    p_tracking_code: code.toLowerCase(),
    p_client_session_id: clientSessionId,
  });
  if (error) return c.text('Service indisponible', 503);
  const result = data as { ok: boolean; url?: string };
  if (!result.ok || !result.url) return notFound(c.env, c.req.raw);
  return c.redirect(result.url, 302);
});

// ------------------------------------------------------------
// Routage statique : SPA privée (noindex) et 404 réel
// ------------------------------------------------------------

const SPA_PREFIXES = [
  '/app',
  '/kiosk',
  '/super-admin',
  '/connexion',
  '/inscription',
  '/mot-de-passe-oublie',
  '/bienvenue',
];

async function serveAsset(env: Env, request: Request, path: string): Promise<Response> {
  const url = new URL(request.url);
  url.pathname = path;
  return env.ASSETS.fetch(new Request(url.toString(), { headers: request.headers }));
}

async function notFound(env: Env, request: Request): Promise<Response> {
  const page = await serveAsset(env, request, '/404.html');
  return new Response(page.body, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

app.get('*', async (c) => {
  const path = new URL(c.req.url).pathname;
  if (SPA_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    const shell = await serveAsset(c.env, c.req.raw, '/app-shell.html');
    if (shell.ok) {
      return new Response(shell.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          // Espaces privés : jamais indexés.
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store',
        },
      });
    }
    // En dev (vite), app-shell.html n'existe pas encore : servir index.html.
    return serveAsset(c.env, c.req.raw, '/index.html');
  }
  return notFound(c.env, c.req.raw);
});

export default app;
