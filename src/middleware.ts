import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

/**
 * Routes only an admin may open: everything under /admin except the list page
 * itself, which the read-only guest role is allowed to see.
 *
 * Stated as "anything deeper than /admin" rather than a list of paths, so a
 * page added later is locked by default instead of being forgotten.
 */
function isAdminOnly(pathname: string): boolean {
  return pathname.startsWith('/admin/') && pathname !== '/admin/';
}

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

  if (isAdminOnly(request.nextUrl.pathname) && session.r !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '?error=readonly';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
