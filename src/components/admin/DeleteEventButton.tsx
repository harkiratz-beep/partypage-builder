'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteEvent } from '@/lib/event-actions';

/**
 * Delete, behind an inline two-step confirm.
 *
 * Deliberately not window.confirm(): a native dialog is easy to dismiss by
 * reflex, it cannot say what else is about to disappear, and it looks wrong on
 * a phone. The second click is the confirmation, and it times out so a
 * half-armed button never sits there waiting to be hit by accident.
 */
export function DeleteEventButton({
  eventId,
  title,
  redirectTo,
  className = '',
}: {
  eventId: string;
  title: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function arm() {
    setError('');
    setArmed(true);
    setTimeout(() => setArmed(false), 6000);
  }

  function confirmDelete() {
    startTransition(async () => {
      const { error: failure } = await deleteEvent(eventId);
      if (failure) {
        setArmed(false);
        setError(failure.message);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {armed ? (
        <>
          <p className="text-sm text-red-800">
            Delete <strong>{title}</strong>? Its RSVPs, updates and photos go too. This cannot be
            undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmDelete}
              disabled={pending}
              className="min-h-[44px] flex-1 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? 'Deleting…' : 'Yes, delete it'}
            </button>
            <button
              type="button"
              onClick={() => setArmed(false)}
              disabled={pending}
              className="min-h-[44px] flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold"
            >
              Keep it
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={arm}
          className="min-h-[44px] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
        >
          Delete event
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
