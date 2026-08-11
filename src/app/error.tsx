'use client';

import { useEffect } from 'react';

/**
 * Route-level error boundary. Without this, an unreachable database renders
 * Next's bare 500 page — no explanation, no way forward.
 */
export default function Error({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('route error', error);
  }, [error]);

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <h1 className="font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted">
        We couldn&apos;t load this page just now. It&apos;s usually temporary — please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white"
      >
        Try again
      </button>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted">Reference: {error.digest}</p>
      )}
    </div>
  );
}
