'use server';

import { revalidatePath } from 'next/cache';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabasePublic } from './supabase/public';
import { supabaseAsAdmin } from './supabase/admin';
import { getRole } from './auth/host';
import { env } from './env';
import type { GalleryImage, Result } from './types';

const BUCKET = 'event-images';

/** Rules for a guest upload. Deliberately tight — this is a public door. */
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PER_UPLOAD = 10;
/** Ceiling per event, so nobody can fill the bucket from an invite link. */
const MAX_PER_EVENT = 300;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Guest photo uploads.
 *
 * This is the one write, besides the RSVP, that an anonymous visitor can make,
 * so the guardrails matter more than the feature:
 *
 *   · the event must exist and be published or completed — a draft or a
 *     deleted party accepts nothing;
 *   · only real image types, capped per file, per upload and per event;
 *   · the storage write goes through the service role, because the anon key
 *     has no write access to the bucket and should not be given any — a
 *     browser-side upload token would be a permanent open door.
 *
 * Anyone holding the invite link can add photos. That is what was asked for,
 * and it is the right trade for a family party — but it does mean the link is
 * the only thing standing between the gallery and a stranger, which is why
 * the host can delete anything from the admin screen.
 */
function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it in Netlify → Site configuration → ' +
        'Environment variables, then redeploy.',
    );
  }
  return createClient(env.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function uploadGuestPhotos(
  slug: string,
  formData: FormData,
): Promise<Result<{ added: number }>> {
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { data: null, error: { message: 'Choose at least one photo.' } };
  if (files.length > MAX_PER_UPLOAD) {
    return { data: null, error: { message: `Please add up to ${MAX_PER_UPLOAD} photos at a time.` } };
  }

  // The anon client sees only live events, so this doubles as the "is this a
  // real, published party" check — a draft simply returns nothing.
  const { data: event, error: lookupError } = await supabasePublic
    .from('events')
    .select('id, slug, status')
    .eq('slug', slug)
    .maybeSingle();

  if (lookupError) {
    console.error('uploadGuestPhotos/lookup', lookupError);
    return { data: null, error: { message: 'Something went wrong. Please try again.' } };
  }
  if (!event) return { data: null, error: { message: 'This party is not accepting photos.' } };

  const supabase = serviceClient();

  const { count } = await supabase
    .from('gallery_images')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', event.id);

  if ((count ?? 0) + files.length > MAX_PER_EVENT) {
    return {
      data: null,
      error: { message: 'This gallery is full. Ask the host to remove some photos first.' },
    };
  }

  const uploadedBy = String(formData.get('uploaded_by') ?? '').trim().slice(0, 60);
  const rows: { event_id: string; image_url: string; caption: string | null; sort_order: number }[] = [];

  for (const [index, file] of files.entries()) {
    if (!ALLOWED.includes(file.type)) {
      return { data: null, error: { message: `"${file.name}" is not a photo we can accept.` } };
    }
    if (file.size > MAX_BYTES) {
      return { data: null, error: { message: `"${file.name}" is larger than 8 MB.` } };
    }

    const extension = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${event.id}/gallery/${Date.now()}-${index}.${extension || 'jpg'}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('uploadGuestPhotos/storage', uploadError);
      return { data: null, error: { message: "Couldn't upload that photo. Please try again." } };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    rows.push({
      event_id: event.id,
      image_url: publicUrl,
      caption: uploadedBy ? `Added by ${uploadedBy}` : null,
      sort_order: (count ?? 0) + index + 1,
    });
  }

  const { error: insertError } = await supabase.from('gallery_images').insert(rows);
  if (insertError) {
    console.error('uploadGuestPhotos/insert', insertError);
    return { data: null, error: { message: 'Uploaded, but the gallery did not update.' } };
  }

  revalidatePath(`/${slug}`);
  revalidatePath('/admin');
  return { data: { added: rows.length }, error: null };
}

/**
 * "That photo has my face in it — take it down."
 *
 * Deliberately available to guests, with no login: someone who wants a picture
 * of themselves or their child removed should not have to find the host and
 * wait. It hides rather than deletes, so the host can see what happened and
 * put it back if it was a misclick. Hidden photos disappear from the public
 * page immediately, which is the part that actually matters to the person
 * asking.
 */
export async function requestPhotoRemoval(
  slug: string,
  imageId: string,
): Promise<Result<{ id: string }>> {
  const supabase = serviceClient();

  const { data: image } = await supabase
    .from('gallery_images')
    .select('id, event_id')
    .eq('id', imageId)
    .maybeSingle();

  if (!image) return { data: null, error: { message: 'That photo is already gone.' } };

  const { error } = await supabase
    .from('gallery_images')
    .update({ visible: false })
    .eq('id', imageId);

  if (error) {
    console.error('requestPhotoRemoval', error);
    return { data: null, error: { message: "Couldn't hide that photo. Please try again." } };
  }

  revalidatePath(`/${slug}`);
  revalidatePath('/admin');
  return { data: { id: imageId }, error: null };
}

/** Host-only: remove a photo for good, file and all. */
export async function deletePhoto(eventId: string, imageId: string): Promise<Result<{ id: string }>> {
  const role = await getRole();
  if (role !== 'admin') {
    return { data: null, error: { message: 'Read-only access — ask the admin to make changes.' } };
  }

  const supabase = await supabaseAsAdmin();

  const { data: image } = await supabase
    .from('gallery_images')
    .select('image_url')
    .eq('id', imageId)
    .maybeSingle();

  const { error } = await supabase.from('gallery_images').delete().eq('id', imageId);
  if (error) {
    console.error('deletePhoto', error);
    return { data: null, error: { message: "Couldn't delete that photo." } };
  }

  // Storage is not covered by the row cascade, so remove the file by hand.
  const marker = `/object/public/${BUCKET}/`;
  const url = image?.image_url ?? '';
  const at = url.indexOf(marker);
  if (at !== -1) {
    const path = decodeURIComponent(url.slice(at + marker.length));
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/${eventId}`);
  return { data: { id: imageId }, error: null };
}

/** Host-only: put a hidden photo back. */
export async function restorePhoto(eventId: string, imageId: string): Promise<Result<GalleryImage>> {
  const role = await getRole();
  if (role !== 'admin') {
    return { data: null, error: { message: 'Read-only access — ask the admin to make changes.' } };
  }

  const supabase = await supabaseAsAdmin();
  const { data, error } = await supabase
    .from('gallery_images')
    .update({ visible: true })
    .eq('id', imageId)
    .select()
    .single();

  if (error) {
    console.error('restorePhoto', error);
    return { data: null, error: { message: "Couldn't restore that photo." } };
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/${eventId}`);
  return { data, error: null };
}
