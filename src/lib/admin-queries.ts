import 'server-only';
import { supabaseAsAdmin, supabaseAsHost } from './supabase/admin';
import { requireAdmin, requireSession } from './auth/host';
import type { Event, Rsvp } from './types';

/**
 * Host reads. Separate from lib/queries.ts because these see drafts too —
 * which is why every one of them checks the session first.
 */

/**
 * Columns a guest may see. `rsvp_phone` is deliberately absent: it is a real
 * contact number, and the guest login has no password.
 */
const GUEST_COLUMNS =
  'id, slug, title, child_name, age, date, start_time, end_time, venue_name, ' +
  'venue_address, maps_url, host_message, thank_you_message, status, theme_id, ' +
  'hero_image_url, hero_image_opacity, created_at';

export async function listEventsForHost(): Promise<Event[]> {
  const session = await requireSession();

  if (session.r === 'admin') {
    const supabase = await supabaseAsAdmin();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  // Guest: the phone number is never fetched, not merely hidden afterwards.
  const supabase = await supabaseAsHost();
  const { data, error } = await supabase
    .from('events')
    .select(GUEST_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Omit<Event, 'rsvp_phone'>[]).map(event => ({
    ...event,
    rsvp_phone: null,
  }));
}

/**
 * One event by id, drafts included. Admin only — the edit screen it feeds can
 * change and delete things, and it shows the contact number.
 *
 * Returns null rather than throwing on a missing row, so a stale bookmark
 * renders a 404 instead of a 500.
 */
export async function getEventForHost(id: string): Promise<Event | null> {
  await requireAdmin();

  const supabase = await supabaseAsAdmin();
  const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();

  if (error) {
    // 22P02 = invalid_text_representation: the id in the URL is not a uuid.
    if (error.code === '22P02') return null;
    throw new Error(error.message);
  }
  return data;
}

/**
 * The only sanctioned way to read RSVP rows — guest names, mobile numbers and
 * notes. Admin-only, twice over: requireAdmin() here, and supabaseAsAdmin()
 * refuses to hand over a client to anyone else.
 *
 * Nothing in the UI calls this yet; it exists so that when an RSVP screen is
 * built, the guarded path is the obvious one to reach for.
 */
export async function listRsvpsForEvent(eventId: string): Promise<Rsvp[]> {
  await requireAdmin();

  const supabase = await supabaseAsAdmin();
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
