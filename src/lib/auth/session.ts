/**
 * Signed host session cookie.
 *
 * Deliberately tiny: a JSON payload plus an HMAC-SHA256 signature, so a cookie
 * cannot be forged or its expiry edited without the server secret.
 *
 * Uses Web Crypto (not node:crypto) so the same code runs in middleware, which
 * executes on the Edge runtime.
 *
 * NOTE: this module must never import the host credentials — middleware imports
 * it, and the less that travels into the Edge bundle the better.
 */

export const SESSION_COOKIE = 'pp_host';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** `admin` can change things. `guest` can only look. */
export type Role = 'admin' | 'guest';

export function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'guest';
}

export interface SessionPayload {
  /** Username that signed in. */
  u: string;
  /** Role. Inside the signed payload, so it cannot be edited client-side. */
  r: Role;
  /** Expiry, epoch seconds. */
  exp: number;
}

/**
 * The HMAC key.
 *
 * Prefers an explicit SESSION_SECRET. Falls back to a value derived from the
 * service role key — which is already required for the admin area, is
 * high-entropy, and (unlike anything committed here) is not public. That gives
 * a strong default without asking for a second environment variable.
 */
function sessionSecret(): string {
  const explicit = process.env.SESSION_SECRET;
  if (explicit && explicit.length >= 16) return explicit;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) return `derived-from-service-role:${serviceKey}`;

  throw new Error(
    'No session secret available. Set SUPABASE_SERVICE_ROLE_KEY (or SESSION_SECRET) ' +
      'in your environment variables.',
  );
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function sign(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return new Uint8Array(signature);
}

/** Length-independent, non-short-circuiting comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export async function createSessionToken(username: string, role: Role): Promise<string> {
  const payload: SessionPayload = {
    u: username,
    r: role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = toBase64Url(await sign(body));
  return `${body}.${signature}`;
}

/** Returns the payload, or null if the token is absent, tampered with, or expired. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;

  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  let expected: string;
  try {
    expected = toBase64Url(await sign(body));
  } catch {
    // No secret configured — treat every session as invalid rather than
    // falling open.
    return null;
  }

  if (!timingSafeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    // An unrecognised role is a rejected session, never a downgraded one.
    if (!isRole(payload.r)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE,
} as const;
