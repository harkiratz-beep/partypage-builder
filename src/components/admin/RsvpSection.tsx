import { summariseRsvps } from '@/lib/admin-queries';
import { CopyGuestListButton } from './CopyGuestListButton';
import type { Rsvp } from '@/lib/types';

/**
 * The RSVP dashboard for one event.
 *
 * Admin-only, and the data path enforces that rather than this component:
 * listRsvpsForEvent() calls requireAdmin(), and the service-role client
 * refuses to load for anyone else. Guest names and mobile numbers never reach
 * a page the read-only login can open.
 *
 * Laid out around the question a host actually has — "how many people am I
 * feeding, and who are they" — so the head count leads, and yes and no are
 * separate lists rather than one list with badges to scan.
 */

/** '9876543210' reads better as '98765 43210', and stays tappable either way. */
function prettyMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return mobile;
}

/**
 * "Mannat + 1 guest" — guest_count is the whole party including the person
 * replying, so the extras are one fewer. The arithmetic every host does in
 * their head, done here instead.
 */
function partyLine(guestName: string, guestCount: number): string {
  const firstName = guestName.trim().split(/\s+/)[0] || guestName;
  const others = Math.max(0, guestCount - 1);

  if (guestCount <= 1) return `${firstName} only`;
  return `${firstName} + ${others} ${others === 1 ? 'guest' : 'guests'}`;
}

function submittedOn(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Newest first within a group. */
function byNewest(a: Rsvp, b: Rsvp): number {
  return b.submitted_at.localeCompare(a.submitted_at);
}

/** The plain-text version, for pasting into a message. */
function guestListText(coming: Rsvp[], declined: Rsvp[], heads: number): string {
  const lines: string[] = [`Coming: ${heads} ${heads === 1 ? 'person' : 'people'}`, ''];

  for (const rsvp of coming) {
    lines.push(`${rsvp.guest_name} (${rsvp.guest_count}) — ${prettyMobile(rsvp.mobile)}`);
    if (rsvp.note) lines.push(`   note: ${rsvp.note}`);
  }

  if (declined.length) {
    lines.push('', `Can't make it: ${declined.length}`, '');
    for (const rsvp of declined) {
      lines.push(`${rsvp.guest_name} — ${prettyMobile(rsvp.mobile)}`);
    }
  }

  return lines.join('\n');
}

function GuestRow({ rsvp, muted }: { rsvp: Rsvp; muted?: boolean }) {
  return (
    <li className={`flex flex-col gap-1 rounded-xl border border-line bg-page p-3 ${muted ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{rsvp.guest_name}</p>
          <a
            href={`tel:${rsvp.mobile.replace(/\s/g, '')}`}
            className="font-mono text-sm text-accent"
          >
            {prettyMobile(rsvp.mobile)}
          </a>
        </div>

        {rsvp.attending ? (
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold leading-none text-emerald-700">
              {rsvp.guest_count}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {rsvp.guest_count === 1 ? 'person' : 'people'}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted">{submittedOn(rsvp.submitted_at)}</span>
        )}
      </div>

      {rsvp.attending && (
        <p className="text-sm text-muted">
          {partyLine(rsvp.guest_name, rsvp.guest_count)} · replied {submittedOn(rsvp.submitted_at)}
        </p>
      )}

      {rsvp.note && (
        <p className="mt-0.5 border-l-2 border-line pl-2.5 text-sm italic text-muted">
          “{rsvp.note}”
        </p>
      )}
    </li>
  );
}

export function RsvpSection({ rsvps }: { rsvps: Rsvp[] }) {
  const summary = summariseRsvps(rsvps);

  const coming = rsvps.filter(rsvp => rsvp.attending).sort(byNewest);
  const declined = rsvps.filter(rsvp => !rsvp.attending).sort(byNewest);

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">RSVPs</h2>
        <span className="text-xs text-muted">
          {summary.replies === 0
            ? 'No replies yet'
            : `${summary.replies} ${summary.replies === 1 ? 'reply' : 'replies'}`}
        </span>
      </div>

      {/*
        The head count leads, in its own block, because it is the one number
        that decides cake, chairs and party bags — and it is not the same as
        the number of replies.
      */}
      <div className="rounded-xl bg-accent-soft px-4 py-4 text-center">
        <p className="text-4xl font-bold leading-none text-accent">{summary.heads}</p>
        <p className="mt-1.5 text-sm font-semibold text-ink">
          {summary.heads === 1 ? 'person coming' : 'people coming'}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          from {summary.attending} {summary.attending === 1 ? 'reply' : 'replies'} saying yes
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col items-center rounded-xl bg-page py-2.5">
          <span className="text-xl font-bold leading-none text-emerald-700">
            {summary.attending}
          </span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Said yes
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-xl bg-page py-2.5">
          <span className="text-xl font-bold leading-none text-ink">{summary.declined}</span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Said no
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-xl bg-page py-2.5">
          <span className="text-xl font-bold leading-none text-muted">{summary.replies}</span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Replies
          </span>
        </div>
      </div>

      {summary.replies === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
          Nobody has replied yet. Replies appear here as guests fill in the invite.
        </p>
      ) : (
        <>
          {coming.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-emerald-800">
                Coming · {coming.length} {coming.length === 1 ? 'family' : 'families'} ·{' '}
                {summary.heads} {summary.heads === 1 ? 'person' : 'people'}
              </h3>
              <ul className="flex flex-col gap-2">
                {coming.map(rsvp => (
                  <GuestRow key={rsvp.id} rsvp={rsvp} />
                ))}
              </ul>
            </div>
          )}

          {declined.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted">
                Can&apos;t make it · {declined.length}
              </h3>
              <ul className="flex flex-col gap-2">
                {declined.map(rsvp => (
                  <GuestRow key={rsvp.id} rsvp={rsvp} muted />
                ))}
              </ul>
            </div>
          )}

          <CopyGuestListButton text={guestListText(coming, declined, summary.heads)} />
        </>
      )}
    </section>
  );
}
