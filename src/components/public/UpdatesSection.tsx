import type { Update } from '@/lib/types';

/**
 * Reads nothing itself — the page fetches, this renders.
 * Ordering (pinned first, then newest) comes from the query.
 */
export function UpdatesSection({ updates }: { updates: Update[] }) {
  if (updates.length === 0) {
    return <p className="text-sm text-muted">No updates yet. Anything important will show up here.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {updates.map(update => (
        <li
          key={update.id}
          className={`rounded-xl border p-3 ${
            update.pinned ? 'border-accent bg-[var(--accent-soft)]' : 'border-line'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{update.title}</p>
            {update.pinned && (
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                Pinned
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">{update.message}</p>
        </li>
      ))}
    </ul>
  );
}
