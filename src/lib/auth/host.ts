import 'server-only';

import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from './session';

/** The signed-in host, or null. Read this in server components and actions. */
export async function getHostSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Guard for every host write. Middleware already redirects signed-out visitors
 * away from /admin, but a server action can be invoked directly, so the check
 * is repeated where the damage would happen.
 */
export async function requireHost(): Promise<SessionPayload> {
  const session = await getHostSession();
  if (!session) throw new Error('Not signed in.');
  return session;
}
