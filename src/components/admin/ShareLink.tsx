'use client';

import { useEffect, useState } from 'react';

const buttonClass =
  'flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-line ' +
  'bg-surface px-3 py-2 text-sm font-semibold';

/**
 * The "send this to people" control.
 *
 * The absolute URL is built in the browser from window.location rather than
 * from NEXT_PUBLIC_SITE_URL, so the copied link always matches the domain the
 * host is actually looking at — including a Netlify preview or a custom domain
 * added later, neither of which the build-time variable would know about.
 */
export function ShareLink({
  slug,
  title,
  disabled,
  disabledReason,
}: {
  slug: string;
  title: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const url = origin ? `${origin}/${slug}` : `/${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access can be refused (an insecure origin, or a locked-down
      // browser). Fall back to the old selection trick rather than failing.
      const field = document.createElement('textarea');
      field.value = url;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (disabled) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        {disabledReason ?? 'Publish this event to get a shareable link.'}
      </p>
    );
  }

  const message = `${title}\n\nYou're invited! Details and RSVP here:\n${url}`;

  return (
    <div className="flex flex-col gap-2">
      <p className="break-all rounded-lg bg-accent-soft px-3 py-2 font-mono text-xs text-ink">
        {url}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={copy} className={buttonClass}>
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
