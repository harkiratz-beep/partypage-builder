import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

/**
 * Keeps signed-out visitors off /admin.
 *
 * This is convenience, not the security boundary: every host action calls
 * requireHost() itself, and guest-facing data is still protected by RLS.
 */
export async function middleware(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '?error=auth';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
