'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeHeroImage, uploadHeroImage } from '@/lib/event-actions';

/**
 * The invite photo.
 *
 * Shown whole at the top of the invite — no cropping, no text over it, so a
 * tall portrait stays tall and a wide snapshot stays wide. The same picture
 * is used for the downloadable invite image and the WhatsApp link preview,
 * which is why there is exactly one of them per event.
 *
 * The preview below is the real thing at the real proportions, not a
 * thumbnail: what the host sees here is what a guest gets.
 */
export function HeroImageCard({
  eventId,
  imageUrl,
}: {
  eventId: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const shown = localPreview ?? imageUrl;

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    // Show it immediately from the local file rather than waiting for the
    // round trip — the upload is often the slowest thing on the page.
    setLocalPreview(URL.createObjectURL(file));

    const payload = new FormData();
    payload.append('file', file);

    startTransition(async () => {
      const { error: failure } = await uploadHeroImage(eventId, payload);
      if (failure) {
        setError(failure.message);
        setLocalPreview(null);
        if (fileInput.current) fileInput.current.value = '';
        return;
      }
      router.refresh();
    });
  }

  function onRemove() {
    setError('');
    startTransition(async () => {
      const { error: failure } = await removeHeroImage(eventId);
      if (failure) { setError(failure.message); return; }
      setLocalPreview(null);
      if (fileInput.current) fileInput.current.value = '';
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">Invite photo</h2>
        <p className="mt-1 text-sm text-muted">
          Shown full width at the top of the invite, and used for the downloadable picture and the
          WhatsApp preview.
        </p>
      </div>

      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="Invite photo preview" className="w-full rounded-xl" />
      ) : (
        <div
          className="flex h-32 items-center justify-center rounded-xl text-sm text-white/90"
          style={{ background: 'var(--hero)' }}
        >
          No photo yet
        </div>
      )}

      <input
        ref={fileInput}
        id="hero-file"
        type="file"
        accept="image/*"
        onChange={onPick}
        disabled={pending}
        className="text-sm file:mr-3 file:min-h-[40px] file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />

      {pending && <p className="text-sm text-muted">Uploading…</p>}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {imageUrl && (
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          className="self-start rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted disabled:opacity-50"
        >
          Remove photo
        </button>
      )}
    </section>
  );
}
