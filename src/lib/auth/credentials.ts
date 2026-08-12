import 'server-only';

import { timingSafeEqual } from './session';

/**
 * The one host login.
 *
 * `server-only` above makes the build fail if this is ever pulled into a client
 * component, so the credentials cannot end up in the JavaScript sent to a
 * browser. They are read from plain (non-NEXT_PUBLIC_) environment variables,
 * which Next.js never inlines into the client bundle.
 *
 * The defaults exist so the site works the moment it deploys. To change the
 * login, set HOST_USERNAME and HOST_PASSWORD in Netlify → Site configuration →
 * Environment variables, then redeploy.
 */
const HOST_USERNAME = process.env.HOST_USERNAME ?? 'Anaya';
const HOST_PASSWORD = process.env.HOST_PASSWORD ?? 'Anaya';

export function checkCredentials(username: string, password: string): boolean {
  // Both compared every time — no early return that would leak which half was
  // wrong through response timing.
  const userOk = timingSafeEqual(username.trim(), HOST_USERNAME);
  const passOk = timingSafeEqual(password, HOST_PASSWORD);
  return userOk && passOk;
}

export function hostUsername(): string {
  return HOST_USERNAME;
}
