import Link from 'next/link';
import { EventForm } from '@/components/admin/EventForm';

export default function NewEventPage() {
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
