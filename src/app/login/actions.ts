'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkCredentials } from '@/lib/auth/credentials';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/auth/session';

/**
 * Username/password sign-in.
 *
 * Runs only on the server: the form posts here, the comparison happens here,
 * and the browser only ever receives an httpOnly cookie it cannot read.
 */
export async function signIn(formData: FormData): Promise<void> {
  const username = String(formData.get('username') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!checkCredentials(username, password)) {
    // Deliberately vague — never say which field was wrong.
    redirect('/login?error=1');
  }

  let token: string;
  try {
    token = await createSessionToken(username.trim());
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
