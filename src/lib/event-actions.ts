'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAsAdmin } from './supabase/admin';
import { getRole } from './auth/host';
import { slugify, validateEvent, type EventInput } from './event-validation';
import type { Event, Result } from './types';

const BUCKET = 'event-images';

/** Every write goes through here first. The guest role is read-only. */
async function assertAdmin(): Promise<string | null> {
  const role = await getRole();
  if (!role) return 'Please sign in first.';
  if (role !== 'admin') return 'Read-only access — ask the admin to make changes.';
  return null;
}

/** The column payload shared by create and update. */
function toRow(input: EventInput) {
  return {
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
  };
}

function friendly(error: { code?: string }, fallback: string): string {
  // 23505 = unique_violation, the only one worth a friendly message.
  if (error.code === '23505') return 'That link name is already taken.';
  return fallback;
}

/**
 * Host writes. Admin only — the guest role is read-only, and the service role
 * client bypasses RLS, so these checks are the whole boundary.
 */
export async function createEvent(input: EventInput): Promise<Result<Event>> {
  const denied = await assertAdmin();
  if (denied) return { data: null, error: { message: denied } };

  const errors = validateEvent(input);
  if (Object.keys(errors).length) {
    return { data: null, error: { message: Object.values(errors)[0] } };
  }

  const supabase = await supabaseAsAdmin();
  const { data, error } = await supabase.from('events').insert(toRow(input)).select().single();

  if (error) {
    console.error('createEvent', error);
    return {
      data: null,
      error: { message: friendly(error, "Couldn't save the event. Please try again.") },
    };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  return { data, error: null };
}

export async function updateEvent(id: string, input: EventInput): Promise<Result<Event>> {
  const denied = await assertAdmin();
  if (denied) return { data: null, error: { message: denied } };

  const errors = validateEvent(input);
  if (Object.keys(errors).length) {
    return { data: null, error: { message: Object.values(errors)[0] } };
  }

  const supabase = await supabaseAsAdmin();

  // The slug is part of the public URL, so an edit can move the invite page.
  // Revalidate the old path too, rather than guessing which one guests hold.
  const { data: before } = await supabase.from('events').select('slug').eq('id', id).single();

  const { data, error } = await supabase
    .from('events')
    .update(toRow(input))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateEvent', error);
    return {
      data: null,
      error: { message: friendly(error, "Couldn't save the changes. Please try again.") },
    };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  if (before?.slug) revalidatePath(`/${before.slug}`);
  revalidatePath(`/${data.slug}`);
  return { data, error: null };
}

/**
 * Delete an event and everything hanging off it.
 *
 * rsvps, updates and gallery_images are all `on delete cascade`, so the row
 * delete takes them with it. Storage is not part of that cascade, so uploaded
 * photos are removed by hand first — otherwise every deleted party leaves its
 * images sitting in the bucket forever.
 */
export async function deleteEvent(id: string): Promise<Result<{ id: string }>> {
  const denied = await assertAdmin();
  if (denied) return { data: null, error: { message: denied } };

  const supabase = await supabaseAsAdmin();

  const { data: event } = await supabase.from('events').select('slug').eq('id', id).single();

  // Best effort: a leftover file is untidy, but it must not block the delete.
  const { data: files } = await supabase.storage.from(BUCKET).list(id);
  if (files?.length) {
    await supabase.storage.from(BUCKET).remove(files.map(file => `${id}/${file.name}`));
  }

  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) {
    console.error('deleteEvent', error);
    return { data: null, error: { message: "Couldn't delete that event. Please try again." } };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  if (event?.slug) revalidatePath(`/${event.slug}`);
  return { data: { id }, error: null };
}

/**
 * The invite photo, shown whole at the top of the public page and reused for
 * the downloadable invite picture and the WhatsApp link preview.
 *
 * Uploaded through the service role rather than straight from the browser:
 * the anon key deliberately cannot write to the bucket, and handing the public
 * a write path to storage is exactly the hole worth not opening.
 *
 * Files land under `<eventId>/<name>` so deleting an event can find them.
 */
export async function uploadHeroImage(id: string, formData: FormData): Promise<Result<Event>> {
  const denied = await assertAdmin();
  if (denied) return { data: null, error: { message: denied } };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { data: null, error: { message: 'Choose a photo first.' } };
  }
  if (!file.type.startsWith('image/')) {
    return { data: null, error: { message: 'That file is not an image.' } };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { data: null, error: { message: 'Please use an image under 5 MB.' } };
  }

  const supabase = await supabaseAsAdmin();

  const extension = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  // Unique name, so a replaced photo is never served from a CDN cache.
  const path = `${id}/hero-${Date.now()}.${extension || 'jpg'}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error('uploadHeroImage', uploadError);
    return { data: null, error: { message: "Couldn't upload that photo. Please try again." } };
  }

  const { data: previous } = await supabase
    .from('events')
    .select('hero_image_url')
    .eq('id', id)
    .single();

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from('events')
    .update({ hero_image_url: publicUrl })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('uploadHeroImage/save', error);
    return { data: null, error: { message: "Uploaded, but couldn't attach it to the event." } };
  }

  await removeStoredFile(supabase, previous?.hero_image_url ?? null);

  revalidatePath('/admin');
  revalidatePath(`/${data.slug}`);
  return { data, error: null };
}

export async function removeHeroImage(id: string): Promise<Result<Event>> {
  const denied = await assertAdmin();
  if (denied) return { data: null, error: { message: denied } };

  const supabase = await supabaseAsAdmin();

  const { data: previous } = await supabase
    .from('events')
    .select('hero_image_url')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('events')
    .update({ hero_image_url: null })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('removeHeroImage', error);
    return { data: null, error: { message: "Couldn't remove that photo." } };
  }

  await removeStoredFile(supabase, previous?.hero_image_url ?? null);

  revalidatePath('/admin');
  revalidatePath(`/${data.slug}`);
  return { data, error: null };
}

/** Turn a public storage URL back into a bucket path and delete it. */
async function removeStoredFile(
  supabase: Awaited<ReturnType<typeof supabaseAsAdmin>>,
  publicUrl: string | null,
): Promise<void> {
  if (!publicUrl) return;
  const marker = `/object/public/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(publicUrl.slice(index + marker.length));
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}
