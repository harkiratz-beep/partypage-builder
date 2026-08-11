/**
 * Shared validation. Deliberately in its own module, not the server-action
 * file: a 'use server' file may only export async functions.
 *
 * The client form and the server action both call this, so the rules can
 * never drift apart.
 */

export interface RsvpInput {
  guest_name: string;
  mobile: string;
  attending: boolean | null;
  guest_count: number;
  note: string;
}

export function validateRsvp(v: RsvpInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.guest_name || v.guest_name.trim().length < 2) e.guest_name = 'Please enter your name.';

  const digits = String(v.mobile || '').replace(/\D/g, '');
  if (!digits) e.mobile = 'Please enter a mobile number.';
  else if (digits.length < 10) e.mobile = 'That number looks too short.';

  if (v.attending === null) e.attending = 'Let us know if you can make it.';
  if (v.attending === true) {
    const n = Number(v.guest_count);
    if (!Number.isFinite(n) || n < 1) e.guest_count = 'How many people are coming?';
    else if (n > 30) e.guest_count = 'That seems high — call the host instead.';
  }
  return e;
}
