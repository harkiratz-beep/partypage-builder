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

/**
 * Where the "Open in Google Maps" button points.
 *
 * An explicit maps_url wins — a host who pasted a pin link meant that exact
 * spot. Otherwise the venue name and address go into a Maps search, which is
 * far more reliable than guessing coordinates. Null means there is nothing to
 * point at, so the button should not be rendered at all.
 */
export function mapsHref(event: {
  maps_url: string | null;
  venue_name: string | null;
  venue_address: string | null;
}): string | null {
  if (event.maps_url) return event.maps_url;

  const query = [event.venue_name, event.venue_address].filter(Boolean).join(', ');
  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Postgres `time` is 'HH:MM:SS'; <input type="time"> wants 'HH:MM'. */
export function toInputTime(t: string | null): string {
  return (t ?? '').slice(0, 5);
}
