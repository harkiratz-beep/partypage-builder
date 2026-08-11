'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env } from '../env';

/** Browser client. Used only for sign-in; all data writes go via actions. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
