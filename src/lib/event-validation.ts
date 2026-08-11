/**
 * Event form rules. Its own module (not the 'use server' file) so the client
 * form and the server action share exactly one copy.
 */

import type { EventStatus, ThemeId } from './types';

export interface EventInput {
  child_name: string;
  age: string;
  title: string;
  slug: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_address: string;
  maps_url: string;
  rsvp_phone: string;
  host_message: string;
  thank_you_message: string;
  status: EventStatus;
  theme_id: ThemeId;
}

export const EMPTY_EVENT: EventInput = {
  child_name: '', age: '', title: '', slug: '', date: '',
  start_time: '', end_time: '', venue_name: '', venue_address: '',
  maps_url: '', rsvp_phone: '', host_message: '', thank_you_message: '',
  status: 'draft', theme_id: 'default',
};

export function slugify(value: string): string {
  return value
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validateEvent(v: EventInput): Record<string, string> {
  const e: Record<string, string> = {};

  if (!v.child_name.trim()) e.child_name = 'Whose birthday is it?';
  if (v.age && (!Number.isFinite(Number(v.age)) || Number(v.age) < 0 || Number(v.age) > 120)) {
    e.age = 'Enter a valid age.';
  }
  if (!v.title.trim()) e.title = 'Give the event a title.';

  if (!v.slug.trim()) e.slug = 'A link name is required.';
  else if (!/^[a-z0-9-]+$/.test(v.slug)) e.slug = 'Lowercase letters, numbers and hyphens only.';

  if (v.end_time && v.start_time && v.end_time <= v.start_time) {
    e.end_time = 'End time must be after the start time.';
  }
  if (v.maps_url && !/^https?:\/\//i.test(v.maps_url)) {
    e.maps_url = 'Must start with http:// or https://';
  }
  if (v.rsvp_phone && v.rsvp_phone.replace(/\D/g, '').length < 10) {
    e.rsvp_phone = 'That number looks too short.';
  }

  // Mirrors the events_publishable CHECK constraint, so the user gets a
  // readable message instead of a Postgres error.
  if (v.status !== 'draft') {
    if (!v.date) e.date = 'A published event needs a date.';
    if (!v.start_time) e.start_time = 'A published event needs a start time.';
    if (!v.venue_name.trim()) e.venue_name = 'A published event needs a venue.';
  }
  if (v.status === 'completed' && !v.thank_you_message.trim()) {
    e.thank_you_message = 'A completed event needs a thank-you message.';
  }

  return e;
}

/** Field order on screen, so "focus the first error" means the topmost one. */
export const FIELD_ORDER: (keyof EventInput)[] = [
  'child_name', 'age', 'title', 'slug', 'date', 'start_time', 'end_time',
  'venue_name', 'venue_address', 'maps_url', 'rsvp_phone', 'thank_you_message',
];
