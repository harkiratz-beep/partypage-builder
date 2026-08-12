import Link from 'next/link';
import { signOut } from '@/app/login/actions';
import { listEventsForHost } from '@/lib/admin-queries';
import { formatDateLong } from '@/lib/format';
import type { EventStatus } from '@/lib/types';

const STATUS_STYLES: Record<EventStatus, string> = {
  draft: 'bg-amber-50 text-amber-800',
  published: 'bg-emerald-50 text-emerald-800',
  completed: 'bg-indigo-50 text-indigo-800',
};

function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export default async function AdminPage() {
  let events: Awaited<ReturnType<typeof listEventsForHost>>;
  try {
    events = await listEventsForHost();
  } catch (error) {
    // Almost always the service role key missing from the environment.
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-bold">Your events</h1>
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-3 text-sm text-red-800">
          {error instanceof Error ? error.message : 'Could not load events.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold">Your events</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/new"
                className="flex items-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">
            New event
          </Link>
          <form action={signOut}>
            <button type="submit"
                    className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          No events yet. Create your first one.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {events.map(event => (
            <li key={event.id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-muted">
                    {formatDateLong(event.date)}
                    {event.venue_name ? ` · ${event.venue_name}` : ''}
                  </p>
                  <p className="font-mono text-xs text-muted">/{event.slug}</p>
                </div>
                <StatusBadge status={event.status} />
              </div>
              <Link href={`/${event.slug}`}
                    className="flex items-center justify-center rounded-lg border border-line px-3 py-2 text-sm font-semibold">
                View invite
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
