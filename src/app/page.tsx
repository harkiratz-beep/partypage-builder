import Link from 'next/link';
import { supabasePublic } from '@/lib/supabase/public';
import { formatDateLong } from '@/lib/format';
import type { Event } from '@/lib/types';

export const revalidate = 60;

async function listLiveEvents(): Promise<Event[]> {
  // RLS limits this to published/completed events already.
  // Degrade to an empty list rather than failing the build or the page if
  // Supabase is unreachable — the invite links themselves still work.
  try {
    const { data, error } = await supabasePublic
      .from('events').select('*').order('date', { ascending: true }).limit(5);
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('listLiveEvents', err);
    return [];
  }
}

export default async function HomePage() {
  const events = await listLiveEvents();

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl px-5 py-8 text-center text-white"
               style={{ background: 'linear-gradient(150deg,#0f172a,#334155)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-90">
          PartyPage Builder
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">One link for the whole party</h1>
        <p className="mt-2.5 text-[15px] opacity-90">
          Details, directions, RSVPs, updates and photos — on a page you can drop into WhatsApp.
        </p>
      </section>

      <Link href="/admin"
            className="flex items-center justify-center rounded-xl bg-accent px-4 py-3 font-semibold text-white">
        Go to admin
      </Link>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-muted">
          Live invites
        </h2>

        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
            No published events yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {events.map(event => (
              <li key={event.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{event.title}</p>
                  <p className="text-sm text-muted">{formatDateLong(event.date)}</p>
                </div>
                <Link href={`/${event.slug}`}
                      className="flex items-center rounded-lg border border-line px-3 py-2 text-sm font-semibold">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
