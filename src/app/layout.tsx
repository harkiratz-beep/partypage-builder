import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { HeaderAdminLink } from '@/components/HeaderAdminLink';
import { env } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  // Chat apps need an absolute og:image URL. Next.js builds one by resolving
  // the generated image against metadataBase — and if metadataBase is unset it
  // quietly uses http://localhost:3000, which no phone can fetch, so the
  // preview just never appears. This one line is what makes the WhatsApp
  // preview work.
  metadataBase: new URL(env.siteUrl),
  title: 'PartyPage Builder',
  description: 'One link for the whole party.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Phone-width column, centred on bigger screens. */}
        <div className="mx-auto min-h-screen max-w-shell bg-page">
          <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-page/90 px-4 py-2.5 backdrop-blur">
            <Link href="/" className="flex-1 text-sm font-bold tracking-tight">
              PartyPage <span className="font-medium text-muted">Builder</span>
            </Link>
            <HeaderAdminLink />
          </header>

          <main className="px-4 pb-12 pt-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
