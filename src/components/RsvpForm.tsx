'use client';

import { useState } from 'react';
import { submitRsvp } from '@/lib/rsvp-actions';
import { validateRsvp, type RsvpInput } from '@/lib/validation';

const BLANK: RsvpInput = {
  guest_name: '', mobile: '', attending: null, guest_count: 1, note: '',
};

export function RsvpForm({ eventId, slug }: { eventId: string; slug: string }) {
  const [values, setValues] = useState<RsvpInput>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ attending: boolean; firstName: string } | null>(null);

  // Editing a field clears that field's error.
  const set = <K extends keyof RsvpInput>(key: K) => (value: RsvpInput[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Same function the server action calls — instant feedback, no round trip.
    const found = validateRsvp(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    const { data, error } = await submitRsvp(eventId, slug, values);
    setSaving(false);

    if (error || !data) {
      setFormError(error?.message ?? 'Something went wrong.');
      return;
    }
    setDone(data);
  }

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-center text-emerald-900">
        <p className="font-semibold">
          {done.attending ? "You're on the list!" : 'Thanks for letting us know'}
        </p>
        <p className="mt-1 text-sm">
          {done.attending
            ? `See you there, ${done.firstName}.`
            : `We'll miss you, ${done.firstName}.`}
        </p>
        <button
          type="button"
          onClick={() => { setDone(null); setValues(BLANK); }}
          className="mt-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold"
        >
          Change response
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-muted">Can you make it?</legend>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Count me in', value: true },
            { label: "Can't make it", value: false },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              aria-pressed={values.attending === option.value}
              onClick={() => set('attending')(option.value)}
              className={`rounded-xl border px-4 py-3 text-left font-semibold ${
                values.attending === option.value
                  ? 'border-accent bg-[var(--accent-soft)] text-accent'
                  : 'border-line bg-surface'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.attending && (
          <p role="alert" className="mt-1 text-xs text-red-700">{errors.attending}</p>
        )}
      </fieldset>

      {values.attending === true && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-muted">How many of you?</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={values.guest_count}
            onChange={e => set('guest_count')(Number(e.target.value))}
            className="min-h-[44px] rounded-xl border border-line px-3 py-2.5"
          />
          {errors.guest_count && (
            <span role="alert" className="text-xs text-red-700">{errors.guest_count}</span>
          )}
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-muted">Your name</span>
        <input
          autoComplete="name"
          value={values.guest_name}
          onChange={e => set('guest_name')(e.target.value)}
          placeholder="Simran Kaur"
          className="min-h-[44px] rounded-xl border border-line px-3 py-2.5"
        />
        {errors.guest_name && (
          <span role="alert" className="text-xs text-red-700">{errors.guest_name}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-muted">Mobile number</span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={values.mobile}
          onChange={e => set('mobile')(e.target.value)}
          placeholder="98765 43210"
          className="min-h-[44px] rounded-xl border border-line px-3 py-2.5"
        />
        <span className="text-xs text-muted">
          Used to reach you if plans change — and to update your reply if you send it twice.
        </span>
        {errors.mobile && (
          <span role="alert" className="text-xs text-red-700">{errors.mobile}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-muted">Anything we should know?</span>
        <textarea
          rows={3}
          value={values.note}
          onChange={e => set('note')(e.target.value)}
          placeholder="Optional"
          className="rounded-xl border border-line px-3 py-2.5"
        />
      </label>

      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Sending…' : 'Send RSVP'}
      </button>
    </form>
  );
}
