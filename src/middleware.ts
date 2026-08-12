import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

/** Routes only an admin may open. */
const ADMIN_ONLY = ['/admin/new'];

/**
 * Keeps signed-out visitors off /admin, and the read-only guest role off the
 * routes that change things.
 *
 * This is convenience, not the security boundary: createEvent() checks the role
 * itself, the service-role client refuses to load without the right session,
 * and guest-facing data is still protected by RLS.
 */
export async function middleware(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '?error=auth';
    return NextResponse.redirect(url);
  }

  const needsAdmin = ADMIN_ONLY.some(path => request.nextUrl.pathname.startsWith(path));
  if (needsAdmin && session.r !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '?error=readonly';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
