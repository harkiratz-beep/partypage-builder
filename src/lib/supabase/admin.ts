import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Host client, service role.
 *
 * Why this exists: host access used to be proved by a Supabase auth JWT, and
 * the RLS policies check `public.is_host()` against the email in that JWT.
 * The host login is now a plain username/password owned by this app, so there
 * is no Supabase JWT any more.
 *
 * The alternative — relaxing the host policies so that any request could write
 * — is exactly the hole migration 0003 closed: the `rsvps` table holds real
 * guest names and mobile numbers. So the policies stay strict and host traffic
 * goes around them with the service role key instead.
 *
 * Rules for using this client:
 *   - server-side only (enforced by `server-only` above; the key is not
 *     NEXT_PUBLIC_ so it is never bundled),
 *   - only after requireHost() has confirmed the session cookie.
 *
 * Guest traffic never touches this — it uses the anon client in public.ts and
 * stays subject to RLS.
 */
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it in Netlify → Site configuration → ' +
        'Environment variables (Supabase dashboard → Project Settings → API keys → ' +
        'service_role), then redeploy.',
    );
  }

  cached = createClient(env.supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
