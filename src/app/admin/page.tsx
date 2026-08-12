import Link from 'next/link';
import { signOut } from '@/app/login/actions';
import { ShareLink } from '@/components/admin/ShareLink';
import { DeleteEventButton } from '@/components/admin/DeleteEventButton';
import { listEventsForHost } from '@/lib/admin-queries';
import { getRole } from '@/lib/auth/host';
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const role = await getRole();
  const isAdmin = role === 'admin';
  const { error: notice } = await searchParams;

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
          {isAdmin && (
            <Link href="/admin/new"
                  className="flex items-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">
              New event
            </Link>
          )}
          <form action={signOut}>
            <button type="submit"
                    className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {!isAdmin && (
        <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          {notice === 'readonly'
            ? 'That page is for the admin. You have read-only access.'
            : 'Read-only access. Sign in as the admin to make changes.'}
        </p>
      )}

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

              <ShareLink
                slug={event.slug}
                title={event.title}
                disabled={event.status === 'draft'}
                disabledReason="Draft — publish it to get a shareable link."
              />

              <div className="flex gap-2">
                <Link href={`/${event.slug}`}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-line px-3 py-2 text-sm font-semibold">
                  View
                </Link>
                {isAdmin && (
                  <Link href={`/admin/${event.id}`}
                        className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-line px-3 py-2 text-sm font-semibold">
                    Edit
                  </Link>
                )}
              </div>

              {isAdmin && <DeleteEventButton eventId={event.id} title={event.title} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
