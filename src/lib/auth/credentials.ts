import 'server-only';

import { timingSafeEqual, type Role } from './session';

/**
 * The two logins.
 *
 * `server-only` above makes the build fail if this is ever pulled into a client
 * component, and none of these variables are NEXT_PUBLIC_, so Next.js will not
 * inline them into the browser bundle.
 *
 *   admin — full access. Password comes from HOST_PASSWORD and has NO default:
 *           this repo is public, so a committed fallback would be a published
 *           password. If HOST_PASSWORD is unset, admin sign-in always fails.
 *   guest — read-only. Username alone; no password.
 */
const ADMIN_USERNAME = process.env.HOST_USERNAME ?? 'admin';
const GUEST_USERNAME = process.env.GUEST_USERNAME ?? 'guest';
const ADMIN_PASSWORD = process.env.HOST_PASSWORD; // intentionally no fallback

let warned = false;

function warnIfUnconfigured(): void {
  if (warned) return;
  warned = true;
  console.error(
    '[auth] HOST_PASSWORD is not set, so admin sign-in will always fail. ' +
      'Set it in Netlify → Site configuration → Environment variables, then redeploy. ' +
      'Guest sign-in is unaffected.',
  );
}

/** Returns the role that these credentials grant, or null. */
export function authenticate(username: string, password: string): Role | null {
  const name = username.trim();

  // Evaluated before any early return so a wrong username and a wrong password
  // cost the same amount of time.
  const looksLikeAdmin = timingSafeEqual(name, ADMIN_USERNAME);
  const looksLikeGuest = timingSafeEqual(name, GUEST_USERNAME);

  if (looksLikeAdmin) {
    if (!ADMIN_PASSWORD) {
      warnIfUnconfigured();
      return null;
    }
    return timingSafeEqual(password, ADMIN_PASSWORD) ? 'admin' : null;
  }

  // Guest is passwordless by design — whatever is in the password box is ignored.
  if (looksLikeGuest) return 'guest';

  return null;
}

export const usernames = { admin: ADMIN_USERNAME, guest: GUEST_USERNAME };
