'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deletePhoto, restorePhoto } from '@/lib/gallery-actions';
import type { GalleryImage } from '@/lib/types';

/**
 * The host's view of the gallery — including the photos guests have hidden.
 *
 * Hidden ones are shown faded with a Restore button rather than vanishing,
 * because "someone asked for this to come down" is information the host wants,
 * and because an accidental tap should be reversible. Delete is permanent and
 * takes the file out of storage too.
 */
export function GalleryManager({
  eventId,
  images,
}: {
  eventId: string;
  images: GalleryImage[];
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [armed, setArmed] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = images.filter(image => image.visible);
  const hidden = images.filter(image => !image.visible);

  function run(action: () => Promise<{ error: { message: string } | null }>) {
    setError('');
    startTransition(async () => {
      const { error: failure } = await action();
      setArmed(null);
      if (failure) { setError(failure.message); return; }
      router.refresh();
    });
  }

  function Tile({ image }: { image: GalleryImage }) {
    return (
      <li className="flex flex-col overflow-hidden rounded-xl border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.image_url}
          alt={image.caption ?? 'Party photo'}
          loading="lazy"
          className={`h-28 w-full bg-line object-cover ${image.visible ? '' : 'opacity-40'}`}
        />
        {image.caption && <p className="px-2 pt-1.5 text-xs text-muted">{image.caption}</p>}

        <div className="mt-auto flex items-center justify-between gap-1 px-2 py-1.5">
          {image.visible ? (
            <span className="text-[11px] text-muted">Visible</span>
          ) : (
            <button
              type="button"
              onClick={() => run(() => restorePhoto(eventId, image.id))}
              disabled={pending}
              className="text-xs font-semibold text-accent disabled:opacity-50"
            >
              Restore
            </button>
          )}

          {armed === image.id ? (
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => run(() => deletePhoto(eventId, image.id))}
                disabled={pending}
                className="text-xs font-semibold text-red-700 disabled:opacity-50"
              >
                Confirm
              </button>
              <button type="button" onClick={() => setArmed(null)} className="text-xs text-muted">
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setArmed(image.id)}
              className="text-xs text-muted underline"
            >
              Delete
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">Party photos</h2>
        <p className="mt-1 text-sm text-muted">
          Guests add these from the invite page. Anyone can hide a photo of themselves; you can
          restore it or delete it for good.
        </p>
      </div>

      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
          No photos yet. They appear here as guests add them.
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-3 gap-2">
            {visible.map(image => (
              <Tile key={image.id} image={image} />
            ))}
          </ul>

          {hidden.length > 0 && (
            <>
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted">
                Hidden by a guest · {hidden.length}
              </h3>
              <ul className="grid grid-cols-3 gap-2">
                {hidden.map(image => (
                  <Tile key={image.id} image={image} />
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </section>
  );
}
