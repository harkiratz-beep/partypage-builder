'use client';

import type { ReactNode } from 'react';

const inputClass =
  'min-h-[44px] w-full rounded-xl border border-line bg-surface px-3 py-2.5 ' +
  'focus:outline-none focus:ring-2 focus:ring-accent';

export function FieldShell({
  label, htmlFor, hint, error, required, children,
}: {
  label: string; htmlFor?: string; hint?: string; error?: string;
  required?: boolean; children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-muted">
        {label}
        {required && <span aria-hidden="true" className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </div>
  );
}

export function TextField({
  id, label, value, onChange, error, hint, required, ...rest
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void;
  error?: string; hint?: string; required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'>) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error} required={required}>
      <input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${inputClass} ${error ? 'border-red-500' : ''}`}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  id, label, value, onChange, error, hint, rows = 3, placeholder,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void;
  error?: string; hint?: string; rows?: number; placeholder?: string;
}) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-xl border border-line bg-surface px-3 py-2.5 ${error ? 'border-red-500' : ''}`}
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  id, label, value, options, onChange, hint,
}: {
  id: string; label: string; value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint}>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className={inputClass}
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </FieldShell>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-line pt-4 first:border-0 first:pt-0">
      <legend className="text-[13px] font-bold uppercase tracking-wider text-muted">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
