'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticate } from '@/lib/auth/credentials';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/auth/session';

/**
 * Sign-in for both roles.
 *
 * Runs only on the server: the form posts here, the comparison happens here,
 * and the browser only ever receives an httpOnly cookie it cannot read. The
 * role is decided here too and travels inside the signed payload, so it cannot
 * be edited into `admin` client-side.
 */
export async function signIn(formData: FormData): Promise<void> {
  const username = String(formData.get('username') ?? '');
  const password = String(formData.get('password') ?? '');

  const role = authenticate(username, password);
  if (!role) {
    // Deliberately vague — never say which field was wrong.
    redirect('/login?error=1');
  }

  let token: string;
  try {
    token = await createSessionToken(username.trim(), role);
  } catch {
    redirect('/login?error=config');
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);

  redirect('/admin');
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  redirect('/login');
}
