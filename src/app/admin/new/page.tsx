import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EventForm } from '@/components/admin/EventForm';
import { getRole } from '@/lib/auth/host';

export default async function NewEventPage() {
  // Middleware already blocks the read-only role; this is the belt to its braces.
  if ((await getRole()) !== 'admin') redirect('/admin?error=readonly');

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="self-start text-sm font-semibold text-muted">
        ← All events
      </Link>
      <h1 className="text-lg font-bold">New event</h1>
      <EventForm />
    </div>
  );
}
