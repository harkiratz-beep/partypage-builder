'use server';

import { revalidatePath } from 'next/cache';
import { supabasePublic } from './supabase/public';
import { validateRsvp, type RsvpInput } from './validation';

/**
 * The only write a guest can make.
 *
 * Goes through the submit_rsvp() SECURITY DEFINER function rather than
 * inserting directly. Two reasons, both discovered against a real database:
 *
 *  1. `.insert().select()` is INSERT..RETURNING, which needs a SELECT policy —
 *     and anon deliberately has none, because that policy would expose the
 *     whole guest list.
 *  2. An upsert's ON CONFLICT DO UPDATE has to read the conflicting row, so it
 *     needs that same SELECT policy.
 *
 * The function returns void, re-checks that the event is published, and
 * normalises the phone number so a correction matches the original reply.
 */
export interface RsvpResult {
  attending: boolean;
  firstName: string;
}

export async function submitRsvp(
  eventId: string,
  slug: string,
  input: RsvpInput,
): Promise<{ data: RsvpResult | null; error: { message: string } | null }> {
  const errors = validateRsvp(input);
  if (Object.keys(errors).length) {
    return { data: null, error: { message: Object.values(errors)[0] } };
  }

  const { error } = await supabasePublic.rpc('submit_rsvp', {
    p_event_id: eventId,
    p_guest_name: input.guest_name.trim(),
    p_mobile: input.mobile,
    p_attending: input.attending as boolean,
    p_guest_count: input.attending ? Number(input.guest_count) : 0,
    p_note: input.note.trim() || null,
  });

  if (error) {
    // 23514 is the check_violation the function raises for a closed event.
    if (error.code === '23514') {
      return { data: null, error: { message: 'This event is no longer accepting RSVPs.' } };
    }
    console.error('submitRsvp', error);
    return { data: null, error: { message: "Couldn't send your RSVP. Please try again." } };
  }

  revalidatePath(`/${slug}`);

  // Nothing comes back from the function by design, so the confirmation is
  // built from what the guest just typed.
  return {
    data: {
      attending: input.attending as boolean,
      firstName: input.guest_name.trim().split(' ')[0],
    },
    error: null,
  };
}
