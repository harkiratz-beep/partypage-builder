import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { RsvpSection } from '@/components/admin/RsvpSection';
import { getEventForHost, listRsvpsForEvent } from '@/lib/admin-queries';
import { getRole } from '@/lib/auth/host';

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: 'RSVPs' };

/**
 * The guest list on its own page.
 *
 * The same list also sits on the event page, but that page is long — the form,
 * the photo, the danger zone — and "who is coming" is the thing a host checks
 * most often. This gives it a URL of its own to bookmark.
 */
export default async function RsvpsPage({ params }: Props) {
  if ((await getRole()) !== 'admin') redirect('/admin?error=readonly');

  const { id } = await params;
  const event = await getEventForHost(id);
  if (!event) notFound();

  const rsvps = await listRsvpsForEvent(event.id);

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/admin/${event.id}`} className="self-start text-sm font-semibold text-muted">
        ← Back to {event.title}
      </Link>

      <h1 className="text-lg font-bold">Who is coming</h1>

      <RsvpSection rsvps={rsvps} />
    </div>
  );
}
