'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestPhotoRemoval, uploadGuestPhotos } from '@/lib/gallery-actions';
import type { GalleryImage } from '@/lib/types';

/**
 * The party gallery — open to everyone holding the invite link.
 *
 * Guests can add photos, download any photo, and take down one that has them
 * in it. That last one has no login by design: someone who wants a picture of
 * their child off a public page should not have to track down the host first.
 * It hides rather than deletes, so the host can undo a misclick.
 *
 * Plain <img> throughout: the sources are Supabase Storage public URLs, and
 * next/image would need remotePatterns config for no real gain on party snaps.
 */
export function GallerySection({
  slug,
  images,
}: {
  slug: string;
  images: GalleryImage[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setError('');
    setMessage('');

    const payload = new FormData();
    for (const file of files) payload.append('files', file);
    if (name.trim()) payload.append('uploaded_by', name.trim());

    startTransition(async () => {
      const { data, error: failure } = await uploadGuestPhotos(slug, payload);
      if (fileInput.current) fileInput.current.value = '';

      if (failure) { setError(failure.message); return; }
      setMessage(`Thank you — ${data?.added} ${data?.added === 1 ? 'photo' : 'photos'} added.`);
      router.refresh();
    });
  }

  function hide(imageId: string) {
    setError('');
    startTransition(async () => {
      const { error: failure } = await requestPhotoRemoval(slug, imageId);
      setConfirming(null);
      if (failure) { setError(failure.message); return; }
      setMessage('That photo has been taken down.');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length === 0 ? (
        <p className="text-sm text-muted">
          No photos yet. Add the first one — everyone with the invite link can see them here.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5">
          {images.map(image => (
            <li
              key={image.id}
              className="flex flex-col overflow-hidden rounded-xl border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.image_url}
                alt={image.caption ?? 'Party photo'}
                loading="lazy"
                className="h-32 w-full bg-line object-cover"
              />

              {image.caption && <p className="px-2 pt-1.5 text-xs text-muted">{image.caption}</p>}

              <div className="mt-auto flex items-center justify-between gap-1 px-2 py-1.5">
                <a
                  href={image.image_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-accent"
                >
                  Download
                </a>

                {confirming === image.id ? (
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => hide(image.id)}
                      disabled={pending}
                      className="text-xs font-semibold text-red-700 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="text-xs text-muted"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(image.id)}
                    className="text-xs text-muted underline"
                  >
                    Remove me
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-line p-3">
        <p className="text-sm font-semibold">Add your photos</p>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="min-h-[44px] w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={onPick}
          disabled={pending}
          className="text-sm file:mr-3 file:min-h-[40px] file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />

        <p className="text-xs text-muted">
          Up to 10 at a time, 8 MB each. Anyone with the invite link can see them. If a photo has
          you in it and you would rather it was not here, tap “Remove me” on it.
        </p>

        {pending && <p className="text-sm text-muted">Uploading…</p>}
        {message && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
