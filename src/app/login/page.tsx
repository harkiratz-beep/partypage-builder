'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { TextField } from '@/components/ui/form';

/**
 * Magic-link sign-in. One host account is enough for a family app — the RLS
 * policies treat any signed-in user as the host.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');

    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setBusy(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
        Check your email for the sign-in link.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Host sign-in</h1>
      <TextField id="login-email" label="Email" type="email" autoComplete="email"
                 value={email} onChange={setEmail} placeholder="you@example.com" />
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</p>
      )}
      <button type="submit" disabled={busy}
              className="rounded-xl bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? 'Sending…' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
