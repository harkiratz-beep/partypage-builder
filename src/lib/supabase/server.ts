import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '../env';

/**
 * Session-aware client for anything the host does, and for host writes.
 * Reading cookies opts the route out of static rendering — correct for
 * /admin, wrong for /[slug], which is why the public client exists.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — middleware refreshes the session.
        }
      },
    },
  });
}
