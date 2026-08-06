import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Client unique, clé anon uniquement (protégée par RLS).
// La clé service_role n'existe que côté Worker (secret Wrangler).
export const supabase = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'anon-key-non-configuree',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
