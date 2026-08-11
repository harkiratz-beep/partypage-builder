import 'server-only';
import { createSupabaseServerClient } from './supabase/server';
import type { Event } from './types';

/**
 * Host reads. Separate from lib/queries.ts because these run through the
 * cookie client and therefore see drafts too.
 */
export async function listEventsForHost(): Promise<Event[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSignedInUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
