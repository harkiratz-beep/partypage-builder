import { redirect } from 'next/navigation';
import { getHostSession } from '@/lib/auth/host';
import { signIn } from './actions';

/**
 * Host sign-in.
 *
 * A plain server-rendered form posting to a server action — no client
 * component, so no credential handling ever reaches the browser bundle.
 */
export const metadata = { title: 'Host sign-in' };

const MESSAGES: Record<string, string> = {
  '1': 'Wrong username or password.',
  config: 'The site is missing its server configuration. Set SUPABASE_SERVICE_ROLE_KEY in Netlify.',
  auth: 'Please sign in to continue.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getHostSession()) redirect('/admin');

  const { error } = await searchParams;
  const message = error ? MESSAGES[error] ?? MESSAGES['1'] : null;

  return (
    <form action={signIn} className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Host sign-in</h1>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-semibold">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          className="rounded-xl border border-line bg-surface px-3 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-xl border border-line bg-surface px-3 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      {message && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
          {message}
        </p>
      )}

      <button
        type="submit"
        className="rounded-xl bg-accent px-4 py-3 font-semibold text-white"
      >
        Sign in
      </button>
    </form>
  );
}
