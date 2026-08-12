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
 * Feeds the RSVP list on the event page.
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

/** Headline numbers for one event's replies. */
export interface RsvpSummary {
  /** Replies that said yes. */
  attending: number;
  /** Replies that said no. */
  declined: number;
  /** People actually coming — the sum of guest_count, not the reply count. */
  heads: number;
  /** Every reply, either way. */
  replies: number;
}

export function emptyRsvpSummary(): RsvpSummary {
  return { attending: 0, declined: 0, heads: 0, replies: 0 };
}

export function summariseRsvps(rsvps: Rsvp[]): RsvpSummary {
  return rsvps.reduce<RsvpSummary>((total, rsvp) => {
    total.replies += 1;
    if (rsvp.attending) {
      total.attending += 1;
      // guest_count is the party size including the guest who replied, so it
      // is the number to add — not 1 + guest_count.
      total.heads += rsvp.guest_count;
    } else {
      total.declined += 1;
    }
    return total;
  }, emptyRsvpSummary());
}

/**
 * Reply counts for every event at once, for the admin list.
 *
 * One query rather than one per event: only the three columns the arithmetic
 * needs are fetched, and no names or mobile numbers are pulled for a screen
 * that never displays them.
 */
export async function summariseAllRsvps(): Promise<Record<string, RsvpSummary>> {
  await requireAdmin();

  const supabase = await supabaseAsAdmin();
  const { data, error } = await supabase.from('rsvps').select('event_id, attending, guest_count');

  if (error) throw new Error(error.message);

  const byEvent: Record<string, RsvpSummary> = {};
  for (const row of data ?? []) {
    const summary = (byEvent[row.event_id] ??= emptyRsvpSummary());
    summary.replies += 1;
    if (row.attending) {
      summary.attending += 1;
      summary.heads += row.guest_count;
    } else {
      summary.declined += 1;
    }
  }
  return byEvent;
}
