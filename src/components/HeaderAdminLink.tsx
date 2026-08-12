'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * The Admin link in the header — for the host only.
 *
 * Guests land on an invite page and have no business seeing a way into the
 * admin area: it is noise at best, and at worst it invites someone to poke at
 * a login screen. So the link only appears on the pages a host is already on.
 *
 * A client component purely because this needs the current path. It is not a
 * security control — /admin is guarded by middleware and every write re-checks
 * the session server-side. Hiding the link is about what guests should see,
 * not about what they are allowed to do.
 */

// Only inside the admin area, where it doubles as "back to the event list".
// Not on /login either — a link to the page that just bounced you here.
const HOST_PATHS = ['/admin'];

export function HeaderAdminLink() {
  const pathname = usePathname();
  const onHostPage = HOST_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));

  if (!onHostPage) return null;

  return (
    <Link
      href="/admin"
      className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold"
    >
      Admin
    </Link>
  );
}
