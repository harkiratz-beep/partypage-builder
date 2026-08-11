import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Guest-facing client. No cookies, no session — so the guest invite page
 * stays cacheable and can be statically revalidated.
 *
 * Everything it can see is decided by the `anon` RLS policies.
 */
export const supabasePublic = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { persistSession: false },
});
