import 'server-only';
import { supabasePublic } from './supabase/public';
import type { Event, GalleryImage, Update } from './types';

/**
 * Guest-facing reads. One function per query, all returning plain rows.
 *
 * These replace the mock-data reads one for one — same names, same shapes —
 * so the pages did not change when Supabase went in.
 *
 * Note there are no `.eq('status', ...)` or `.eq('active', true)` filters for
 * visibility: RLS already applies them. Filtering here too would be belt and
 * braces that quietly rots when a policy changes.
 */

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const { data, error } = await supabasePublic
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function listUpdates(eventId: string): Promise<Update[]> {
  const { data, error } = await supabasePublic
    .from('updates')
    .select('*')
    .eq('event_id', eventId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listGalleryImages(eventId: string): Promise<GalleryImage[]> {
  const { data, error } = await supabasePublic
    .from('gallery_images')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Postgres `time` comes back as 'HH:MM:SS'. Inputs and display want 'HH:MM'. */
export function toInputTime(t: string | null): string {
  return (t ?? '').slice(0, 5);
}
