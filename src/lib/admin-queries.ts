import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { requireHost } from './auth/host';
import type { Event } from './types';

/**
 * Host reads. Separate from lib/queries.ts because these see drafts too —
 * which is precisely why every one of them checks the session first.
 */
export async function listEventsForHost(): Promise<Event[]> {
  await requireHost();

  const { data, error } = await supabaseAdmin()
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
