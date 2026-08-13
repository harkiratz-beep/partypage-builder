import { notFound } from 'next/navigation';
import { getEventBySlug, listGalleryImages, listUpdates } from '@/lib/queries';
import { formatDateLong, formatTimeRange, mapsHref } from '@/lib/format';
import { RsvpForm } from '@/components/RsvpForm';
import { UpdatesSection } from '@/components/public/UpdatesSection';
import { GallerySection } from '@/components/public/GallerySection';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  // A throw in generateMetadata happens before rendering starts, so error.tsx
  // cannot catch it — the visitor gets a bare 500. Swallow it here and let the
  // page component throw instead, where the error boundary can do its job.
  try {
    const event = await getEventBySlug(slug);
    if (!event) return { title: 'Invite not found' };

    const description = [
      event.age !== null ? `${event.child_name} is turning ${event.age}` : event.child_name,
      formatDateLong(event.date),
      event.venue_name,
    ]
      .filter(Boolean)
      .join(' · ');

    // og:image is supplied by opengraph-image.tsx; openGraph is set here so
    // the title and description in a chat preview read like an invitation
    // rather than like a web page.
    return {
      title: event.title,
      description,
      openGraph: { title: event.title, description, type: 'website' },
    };
  } catch {
    return { title: 'Invite' };
  }
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-muted">{title}</h2>
      {children}
    </section>
  );
}

/** One line of the details card: a small grey label above the real content. */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <div className="text-[15px]">{children}</div>
    </div>
  );
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;

  const event = await getEventBySlug(slug);
  if (!event) notFound();          // also covers drafts: RLS hides them from anon

  const [updates, images] = await Promise.all([
    listUpdates(event.id),
    listGalleryImages(event.id),
  ]);

  const maps = mapsHref(event);

  return (
    <div className="flex flex-col gap-4">
      {/*
        The photo, and only the photo.
        No text sits on top of it, so nothing has to be legible against an
        unknown image, and no crop is needed: width 100%, height auto keeps
        the picture at its own proportions whether it is a tall portrait or a
        wide snapshot. Everything the guest needs to read lives in the card
        below instead.
      */}
      {event.hero_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.hero_image_url}
          alt={`${event.child_name}'s birthday`}
          className="w-full rounded-2xl"
        />
      ) : (
        <div
          className="rounded-2xl px-5 py-10 text-center text-white"
          style={{ background: 'var(--hero)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-90">
            You&apos;re invited
          </p>
        </div>
      )}

      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          You&apos;re invited
        </p>
        <h1 className="mt-1.5 text-4xl font-bold leading-none">{event.child_name}</h1>
        {event.age !== null && (
          <p className="mt-2 text-lg text-muted">is turning {event.age}</p>
        )}
      </div>

      <SectionShell title="When and where">
        <div className="flex flex-col gap-3">
          <DetailRow label="Date">{formatDateLong(event.date)}</DetailRow>

          {event.start_time && (
            <DetailRow label="Time">{formatTimeRange(event.start_time, event.end_time)}</DetailRow>
          )}

          {event.venue_name && (
            <DetailRow label="Venue">
              <p className="font-semibold">{event.venue_name}</p>
              {event.venue_address && (
                <p className="text-sm text-muted">{event.venue_address}</p>
              )}
            </DetailRow>
          )}

          {maps && (
            <a
              href={maps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-3 font-semibold text-white"
            >
              Open in Google Maps
            </a>
          )}
        </div>
      </SectionShell>

      {/*
        The host's own words, set larger than everything under it. This is the
        one bit of the page written by a person rather than assembled from
        fields, so it should read like the message it is — not like another
        row of data. whitespace-pre-line keeps the line breaks the host typed.
      */}
      {event.host_message && (
        <SectionShell title="A note from the host">
          <p className="whitespace-pre-line text-lg leading-relaxed">{event.host_message}</p>
        </SectionShell>
      )}

      <SectionShell title="Updates">
        <UpdatesSection updates={updates} />
      </SectionShell>

      <SectionShell title="RSVP">
        {event.status === 'published'
          ? <RsvpForm eventId={event.id} slug={event.slug} />
          : <p className="text-sm text-muted">RSVPs are closed.</p>}
      </SectionShell>

      <SectionShell title="Party photos">
        <GallerySection slug={event.slug} images={images} />
      </SectionShell>

      {event.status === 'completed' && event.thank_you_message && (
        <SectionShell title="Thank you">
          <p>{event.thank_you_message}</p>
        </SectionShell>
      )}
    </div>
  );
}
