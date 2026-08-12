/**
 * Single place the Supabase credentials are read.
 *
 * Next.js inlines NEXT_PUBLIC_* at build time, so these must be referenced as
 * full literals — `process.env[name]` would return undefined in the browser.
 * Failing loudly here beats a confusing "Invalid API key" at runtime.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  /**
   * The site's own address, used as metadataBase so og:image comes out as an
   * absolute https URL. Without it Next.js falls back to localhost:3000 and
   * WhatsApp silently shows no preview at all.
   *
   * NEXT_PUBLIC_SITE_URL first, then Netlify's own URL (set automatically on
   * every deploy), then localhost for `next dev`.
   */
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    'http://localhost:3000',
};
