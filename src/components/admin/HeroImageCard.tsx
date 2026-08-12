'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeHeroImage, setHeroOpacity, uploadHeroImage } from '@/lib/event-actions';

/**
 * The reusable theme/hero photo.
 *
 * One photo per event, shown as a faint watermark behind the invite header —
 * so any picture works without wrecking the readability of the text on top of
 * it. The strength slider is the whole trick: a busy photo goes down to 10%, a
 * plain one can sit at 40%.
 *
 * The preview here paints the photo over the same gradient the public page
 * uses, at the same opacity, so what the host sees is what a guest gets.
 */
export function HeroImageCard({
  eventId,
  imageUrl,
  opacity,
}: {
  eventId: string;
  imageUrl: string | null;
  opacity: number;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [strength, setStrength] = useState(opacity);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const shown = localPreview ?? imageUrl;

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
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

  /** Saved on release, not on drag — one write per adjustment, not fifty. */
  function commitStrength(value: number) {
    startTransition(async () => {
      const { error: failure } = await setHeroOpacity(eventId, value);
      if (failure) { setError(failure.message); return; }
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">Hero photo</h2>
        <p className="mt-1 text-sm text-muted">
          Sits behind the invite header as a soft watermark. Any photo of the birthday child works.
        </p>
      </div>

      <div
        className="relative flex h-36 items-center justify-center overflow-hidden rounded-xl text-center text-white"
        style={{ background: 'var(--hero)' }}
      >
        {shown && (
          // A plain <img>: the file lives on a Supabase domain that would
          // otherwise have to be allow-listed in next.config for next/image,
          // and a decorative watermark gains nothing from the optimiser.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: strength }}
          />
        )}
        <div className="relative px-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-90">
            You&apos;re invited
          </p>
          <p className="mt-1 text-2xl font-bold leading-none">Preview</p>
        </div>
      </div>

      {shown && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-muted">
            Watermark strength — {Math.round(strength * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.02}
            value={strength}
            onChange={e => setStrength(Number(e.target.value))}
            onMouseUp={e => commitStrength(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={e => commitStrength(Number((e.target as HTMLInputElement).value))}
            onKeyUp={e => commitStrength(Number((e.target as HTMLInputElement).value))}
            className="w-full accent-accent"
          />
          <span className="text-xs text-muted">
            Higher shows more of the photo. Keep it low if the header text gets hard to read.
          </span>
        </label>
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

      {pending && <p className="text-sm text-muted">Working…</p>}
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
