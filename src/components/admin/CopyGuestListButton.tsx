'use client';

import { useState } from 'react';

/**
 * Copies the guest list as plain text.
 *
 * The text is built on the server and passed in whole, so this component never
 * touches guest data beyond putting it on the clipboard — and there is exactly
 * one place the wording lives.
 *
 * Plain text rather than CSV on purpose: this gets pasted into a WhatsApp
 * message to a partner or a caterer far more often than it gets opened in a
 * spreadsheet.
 */
export function CopyGuestListButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard access can be refused. Fall back to the selection trick.
      const field = document.createElement('textarea');
      field.value = text;
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

  return (
    <button
      type="button"
      onClick={copy}
      className="min-h-[44px] rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold"
    >
      {copied ? 'Copied ✓' : 'Copy guest list'}
    </button>
  );
}
