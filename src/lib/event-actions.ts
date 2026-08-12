'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from './supabase/admin';
import { getHostSession } from './auth/host';
import { slugify, validateEvent, type EventInput } from './event-validation';
import type { Event, Result } from './types';

/**
 * Host writes. The service role client bypasses RLS, so the signed session
 * cookie is the only thing standing in front of it — check it first, always.
 */
export async function createEvent(input: EventInput): Promise<Result<Event>> {
  if (!(await getHostSession())) {
    return { data: null, error: { message: 'Please sign in first.' } };
  }

  const errors = validateEvent(input);
  if (Object.keys(errors).length) {
    return { data: null, error: { message: Object.values(errors)[0] } };
  }

  const { data, error } = await supabaseAdmin()
    .from('events')
    .insert({
      child_name: input.child_name.trim(),
      age: input.age === '' ? null : Number(input.age),
      title: input.title.trim(),
      slug: slugify(input.slug),
      date: input.date || null,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      venue_name: input.venue_name.trim() || null,
      venue_address: input.venue_address.trim() || null,
      maps_url: input.maps_url.trim() || null,
      rsvp_phone: input.rsvp_phone.trim() || null,
      host_message: input.host_message.trim() || null,
      thank_you_message: input.thank_you_message.trim() || null,
      status: input.status,
      theme_id: input.theme_id,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation, the only one worth a friendly message.
    if (error.code === '23505') {
      return { data: null, error: { message: 'That link name is already taken.' } };
    }
    console.error('createEvent', error);
    return { data: null, error: { message: "Couldn't save the event. Please try again." } };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  return { data, error: null };
}
