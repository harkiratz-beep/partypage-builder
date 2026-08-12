import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin, requireSession } from '../auth/host';
import { env } from '../env';

/**
 * Service-role Supabase access.
 *
 * Why this exists: host access used to be proved by a Supabase auth JWT, and
 * the RLS policies check `public.is_host()` against the email in that JWT.
 * Logins are now owned by this app, so there is no Supabase JWT any more.
 *
 * The alternative — relaxing the host policies so any request could read or
 * write — is exactly the hole migration 0003 closed: the `rsvps` table holds
 * real guest names and mobile numbers. So the policies stay strict and host
 * traffic goes around them with the service role key instead.
 *
 * This key bypasses RLS entirely, so it is never handed out without a session
 * check. Two doors, and which one you use decides who gets in:
 *
 *   supabaseAsAdmin()  — admin only. USE THIS FOR ANYTHING TOUCHING `rsvps`,
 *                        and for every write.
 *   supabaseAsHost()   — admin or guest. Read-only by convention, and callers
 *                        must select explicit safe columns for guests.
 *
 * Guest traffic on the public invite pages never touches either — it uses the
 * anon client in public.ts and stays subject to RLS.
 */
let cached: SupabaseClient | null = null;

function client(): SupabaseClient {
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

/** Full access. Throws unless the caller holds an admin session. */
export async function supabaseAsAdmin(): Promise<SupabaseClient> {
  await requireAdmin();
  return client();
}

/** Any signed-in role. Never use this to read `rsvps`. */
export async function supabaseAsHost(): Promise<SupabaseClient> {
  await requireSession();
  return client();
}
