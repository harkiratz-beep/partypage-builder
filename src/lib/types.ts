/**
 * Shared types. One interface per future Supabase table, named exactly as the
 * columns will be, so the data layer can be swapped without touching the UI.
 */

export type EventStatus = 'draft' | 'published' | 'completed';
export type UpdateType = 'info' | 'reminder' | 'change';
export type ThemeId = 'default' | 'bloom' | 'jungle' | 'ocean';

export interface Event {
  id: string;
  slug: string;
  title: string;
  child_name: string;
  age: number | null;
  date: string | null;          // 'YYYY-MM-DD'
  start_time: string | null;    // 'HH:MM'
  end_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  maps_url: string | null;
  rsvp_phone: string | null;
  host_message: string | null;
  thank_you_message: string | null;
  status: EventStatus;
  theme_id: ThemeId;
  hero_image_url: string | null;
  hero_image_opacity: number;
  created_at: string;
}

export interface Rsvp {
  id: string;
  event_id: string;
  guest_name: string;
  mobile: string;
  attending: boolean;
  guest_count: number;
  note: string | null;
  submitted_at: string;
}

export interface Update {
  id: string;
  event_id: string;
  type: UpdateType;
  title: string;
  message: string;
  active: boolean;
  pinned: boolean;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  event_id: string;
  image_url: string;
  caption: string | null;
  category: string | null;
  sort_order: number;
  visible: boolean;
}

/** Supabase-shaped result, so swapping the data layer changes no call sites. */
export interface Result<T> {
  data: T | null;
  error: { message: string } | null;
}
