import { summariseRsvps } from '@/lib/admin-queries';
import type { Rsvp } from '@/lib/types';

/**
 * Who is coming.
 *
 * Admin-only, and the data path enforces that rather than this component:
 * listRsvpsForEvent() calls requireAdmin(), and the service-role client
 * refuses to load for anyone else. Guest names and mobile numbers never reach
 * a page the read-only login can open.
 *
 * Sorted yes-first, then newest, because the useful question is almost always
 * "who is actually coming" rather than "who replied most recently".
 */

function Stat({ value, label, tone }: { value: number; label: string; tone?: 'good' | 'muted' }) {
  const colour =
    tone === 'good' ? 'text-emerald-700' : tone === 'muted' ? 'text-muted' : 'text-ink';

  return (
    <div className="flex flex-1 flex-col items-center rounded-xl bg-page py-2.5">
      <span className={`text-xl font-bold leading-none ${colour}`}>{value}</span>
      <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}

/** '9876543210' reads better as '98765 43210', and stays tappable either way. */
function prettyMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return mobile;
}

function submittedOn(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function RsvpSection({ rsvps }: { rsvps: Rsvp[] }) {
  const summary = summariseRsvps(rsvps);

  const sorted = [...rsvps].sort((a, b) => {
    if (a.attending !== b.attending) return a.attending ? -1 : 1;
    return b.submitted_at.localeCompare(a.submitted_at);
  });

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">RSVPs</h2>
        <span className="text-xs text-muted">
          {summary.replies === 0
            ? 'No replies yet'
            : `${summary.replies} ${summary.replies === 1 ? 'reply' : 'replies'}`}
        </span>
      </div>

      <div className="flex gap-2">
        <Stat value={summary.heads} label="Coming" tone="good" />
        <Stat value={summary.attending} label="Yes" />
        <Stat value={summary.declined} label="No" tone="muted" />
      </div>

      {summary.replies === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
          Nobody has replied yet. Replies appear here as guests fill in the invite.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map(rsvp => (
            <li
              key={rsvp.id}
              className={`flex flex-col gap-1 rounded-xl border p-3 ${
                rsvp.attending ? 'border-line bg-page' : 'border-line bg-page opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{rsvp.guest_name}</p>
                  <a
                    href={`tel:${rsvp.mobile.replace(/\s/g, '')}`}
                    className="font-mono text-sm text-accent"
                  >
                    {prettyMobile(rsvp.mobile)}
                  </a>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      rsvp.attending
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {rsvp.attending ? `Coming · ${rsvp.guest_count}` : 'Not coming'}
                  </span>
                  <span className="text-[11px] text-muted">{submittedOn(rsvp.submitted_at)}</span>
                </div>
              </div>

              {rsvp.note && <p className="text-sm text-muted">“{rsvp.note}”</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
