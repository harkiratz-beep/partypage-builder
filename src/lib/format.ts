/**
 * Display formatting. No React, no data access — safe to import anywhere,
 * including Server Components.
 */

export function formatDateLong(dateStr: string | null): string {
  if (!dateStr) return 'Date to be confirmed';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function formatTime(t: string | null): string {
  if (!t) return '';
  // Postgres `time` arrives as 'HH:MM:SS'; take the first two parts.
  const [hStr, m] = t.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return t;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m || '00'} ${suffix}`;
}

export function formatTimeRange(start: string | null, end: string | null): string {
  if (!start) return '';
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** Postgres `time` is 'HH:MM:SS'; <input type="time"> wants 'HH:MM'. */
export function toInputTime(t: string | null): string {
  return (t ?? '').slice(0, 5);
}
