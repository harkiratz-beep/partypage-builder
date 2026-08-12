import 'server-only';

import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken, type Role, type SessionPayload } from './session';

/** The signed-in session, or null. Read this in server components and actions. */
export async function getHostSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function getRole(): Promise<Role | null> {
  return (await getHostSession())?.r ?? null;
}

/**
 * Any signed-in role. Middleware already redirects signed-out visitors away
 * from /admin, but a server action can be invoked directly, so the check is
 * repeated where the damage would happen.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getHostSession();
  if (!session) throw new Error('Not signed in.');
  return session;
}

/**
 * Admin only. Guard for every write, and for anything that touches RSVP rows —
 * the guest login is passwordless, so a guest session is effectively a public
 * visitor and must never reach guest names or mobile numbers.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.r !== 'admin') throw new Error('Admins only.');
  return session;
}
