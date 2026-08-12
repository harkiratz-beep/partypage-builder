import { notFound } from 'next/navigation';
import { getEventBySlug, listGalleryImages, listUpdates } from '@/lib/queries';
import { formatDateLong, formatTimeRange } from '@/lib/format';
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

    return {
      title: event.title,
      description: [formatDateLong(event.date), event.venue_name].filter(Boolean).join(' · '),
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

export default async function EventPage({ params }: Props) {
  const { slug } = await params;

  const event = await getEventBySlug(slug);
  if (!event) notFound();          // also covers drafts: RLS hides them from anon

  const [updates, images] = await Promise.all([
    listUpdates(event.id),
    listGalleryImages(event.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <header
        className="relative overflow-hidden rounded-2xl px-5 py-8 text-center text-white"
        style={{ background: 'var(--hero)' }}
      >
        {/*
          The hero photo, as a watermark: the gradient stays underneath and the
          photo is laid over it at the strength the host chose, so the text on
          top keeps its contrast whatever picture gets uploaded. Decorative
          only, hence the empty alt and aria-hidden.

          A plain <img> rather than next/image — the file sits on a Supabase
          domain that would need allow-listing in next.config, and the
          optimiser buys nothing for a background wash.
        */}
        {event.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.hero_image_url}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{ opacity: event.hero_image_opacity }}
          />
        )}

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-90">
            You&apos;re invited
          </p>
          <h1 className="mt-2.5 text-4xl font-bold leading-none">{event.child_name}</h1>
          {event.age !== null && (
            <p className="mt-3 inline-block rounded-full border border-white/35 bg-white/20 px-4 py-1 text-sm font-bold">
              is turning {event.age}
            </p>
          )}
          <p className="mt-3 text-sm opacity-90">{event.title}</p>
          <p className="mt-4 text-[15px] font-semibold">
            {formatDateLong(event.date)}
            <br />
            {formatTimeRange(event.start_time, event.end_time)}
          </p>
        </div>
      </header>

      <SectionShell title="Details">
        <p className="font-semibold">{event.venue_name}</p>
        {event.venue_address && <p className="text-sm text-muted">{event.venue_address}</p>}
      </SectionShell>

      {event.host_message && (
        <SectionShell title="A note from the host">
          <p>{event.host_message}</p>
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

      <SectionShell title="Gallery">
        <GallerySection images={images} />
      </SectionShell>

      {event.status === 'completed' && event.thank_you_message && (
        <SectionShell title="Thank you">
          <p>{event.thank_you_message}</p>
        </SectionShell>
      )}
    </div>
  );
}
