import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { EventForm } from '@/components/admin/EventForm';
import { HeroImageCard } from '@/components/admin/HeroImageCard';
import { ShareLink } from '@/components/admin/ShareLink';
import { DeleteEventButton } from '@/components/admin/DeleteEventButton';
import { RsvpSection } from '@/components/admin/RsvpSection';
import { getEventForHost, listRsvpsForEvent } from '@/lib/admin-queries';
import { getRole } from '@/lib/auth/host';
import { eventToInput } from '@/lib/event-validation';

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: 'Edit event' };

export default async function EditEventPage({ params }: Props) {
  // Middleware already blocks the read-only role; this is the belt to its braces.
  if ((await getRole()) !== 'admin') redirect('/admin?error=readonly');

  const { id } = await params;
  const event = await getEventForHost(id);
  if (!event) notFound();

  const rsvps = await listRsvpsForEvent(event.id);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin" className="self-start text-sm font-semibold text-muted">
        ← All events
      </Link>

      <div>
        <h1 className="text-lg font-bold">{event.title}</h1>
        <p className="font-mono text-xs text-muted">/{event.slug}</p>
      </div>

      <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">Invite link</h2>
        <ShareLink
          slug={event.slug}
          title={event.title}
          disabled={event.status === 'draft'}
          disabledReason="This event is still a draft, so the link would show “not found”. Set the status to Published below and save."
        />
      </section>

      <RsvpSection rsvps={rsvps} />

      <HeroImageCard eventId={event.id} imageUrl={event.hero_image_url} />

      <EventForm eventId={event.id} initialValues={eventToInput(event)} />

      <section className="flex flex-col gap-3 rounded-card border border-red-200 bg-red-50/40 p-4">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-red-800">Danger zone</h2>
        <DeleteEventButton eventId={event.id} title={event.title} redirectTo="/admin" />
      </section>
    </div>
  );
}
