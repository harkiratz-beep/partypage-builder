'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/event-actions';
import {
  EMPTY_EVENT, FIELD_ORDER, slugify, validateEvent, type EventInput,
} from '@/lib/event-validation';
import { FormSection, SelectField, TextAreaField, TextField } from '@/components/ui/form';
import type { EventStatus, ThemeId } from '@/lib/types';

const STATUSES: readonly EventStatus[] = ['draft', 'published', 'completed'];
const THEMES: readonly ThemeId[] = ['default', 'bloom', 'jungle', 'ocean'];

export function EventForm() {
  const router = useRouter();
  const [values, setValues] = useState<EventInput>(EMPTY_EVENT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  // Editing a field clears that field's error.
  const set = <K extends keyof EventInput>(key: K) => (value: EventInput[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Derive the link name until the host edits it directly.
  useEffect(() => {
    if (slugTouched) return;
    const next = slugify(
      [values.child_name, values.age ? `turns ${values.age}` : ''].filter(Boolean).join(' '),
    );
    setValues(prev => (prev.slug === next ? prev : { ...prev, slug: next }));
  }, [values.child_name, values.age, slugTouched]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const found = validateEvent(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      const first = FIELD_ORDER.find(k => found[k]);
      document.getElementById(`f-${first}`)?.focus();
      return;
    }

    setSaving(true);
    const { data, error } = await createEvent(values);
    setSaving(false);

    if (error || !data) { setFormError(error?.message ?? 'Save failed.'); return; }

    router.push('/admin');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormSection title="The basics">
        <div className="grid grid-cols-2 gap-3">
          <TextField id="f-child_name" label="Child's name" required
                     value={values.child_name} onChange={set('child_name')}
                     error={errors.child_name} placeholder="Aarav" />
          <TextField id="f-age" label="Turning" type="number" inputMode="numeric" min={0}
                     value={values.age} onChange={set('age')} error={errors.age} placeholder="5" />
        </div>

        <TextField id="f-title" label="Event title" required
                   value={values.title} onChange={set('title')}
                   error={errors.title} placeholder="Aarav's 5th Birthday" />

        <TextField id="f-slug" label="Link name" required
                   value={values.slug}
                   onChange={v => { setSlugTouched(true); set('slug')(v); }}
                   error={errors.slug} hint={`Invite link: /${slugify(values.slug) || '…'}`}
                   autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      </FormSection>

      <FormSection title="When">
        <TextField id="f-date" label="Date" type="date"
                   value={values.date} onChange={set('date')} error={errors.date} />
        <div className="grid grid-cols-2 gap-3">
          <TextField id="f-start_time" label="Starts" type="time"
                     value={values.start_time} onChange={set('start_time')} error={errors.start_time} />
          <TextField id="f-end_time" label="Ends" type="time"
                     value={values.end_time} onChange={set('end_time')} error={errors.end_time} />
        </div>
      </FormSection>

      <FormSection title="Where">
        <TextField id="f-venue_name" label="Venue name"
                   value={values.venue_name} onChange={set('venue_name')}
                   error={errors.venue_name} placeholder="Funtasia Play Zone" />
        <TextAreaField id="f-venue_address" label="Venue address" rows={2}
                       value={values.venue_address} onChange={set('venue_address')}
                       hint="Used to build the Google Maps link."
                       placeholder="SCO 12, Sector 82, JLPL, Mohali" />
        <TextField id="f-maps_url" label="Google Maps link" type="url"
                   value={values.maps_url} onChange={set('maps_url')}
                   error={errors.maps_url} hint="Optional — overrides the generated link."
                   placeholder="https://maps.app.goo.gl/…" />
        <TextField id="f-rsvp_phone" label="Contact number" type="tel"
                   value={values.rsvp_phone} onChange={set('rsvp_phone')}
                   error={errors.rsvp_phone} placeholder="+91 98765 43210" />
      </FormSection>

      <FormSection title="Messages">
        <TextAreaField id="f-host_message" label="Message to guests"
                       value={values.host_message} onChange={set('host_message')}
                       placeholder="We'd love for you to join us…" />
        <TextAreaField id="f-thank_you_message" label="Thank-you message"
                       value={values.thank_you_message} onChange={set('thank_you_message')}
                       error={errors.thank_you_message}
                       hint="Shown once the event is marked completed." />
      </FormSection>

      <FormSection title="Look and visibility">
        <SelectField id="f-theme_id" label="Theme" value={values.theme_id}
                     options={THEMES} onChange={set('theme_id')} />
        <SelectField id="f-status" label="Status" value={values.status}
                     options={STATUSES} onChange={set('status')}
                     hint="Draft is private · Published is live · Completed reveals the thank-you note." />
      </FormSection>

      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
          {formError}
        </p>
      )}

      <button type="submit" disabled={saving}
              className="rounded-xl bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50">
        {saving ? 'Saving…' : 'Create event'}
      </button>
    </form>
  );
}
