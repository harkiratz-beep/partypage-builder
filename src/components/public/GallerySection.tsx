import type { GalleryImage } from '@/lib/types';

/**
 * Plain <img> on purpose: sources are Supabase Storage public URLs, and
 * next/image's optimiser would need remotePatterns config for no real gain
 * on a handful of party photos.
 */
export function GallerySection({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) {
    return <p className="text-sm text-muted">Photos will be added here after the party.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-2.5">
      {images.map(image => (
        <li key={image.id} className="overflow-hidden rounded-xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.image_url}
            alt={image.caption ?? 'Party photo'}
            loading="lazy"
            className="h-28 w-full bg-line object-cover"
          />
          {image.caption && (
            <p className="px-2 py-1.5 text-xs text-muted">{image.caption}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
