import { getEventBySlug } from '@/lib/queries';
import { inviteCardSize, renderInviteCard } from '@/lib/invite-card';

/**
 * The thumbnail WhatsApp (and everything else) shows when the invite link is
 * pasted into a chat.
 *
 * Next.js picks this file up by name and writes the og:image tags itself — no
 * metadata wiring needed in page.tsx.
 */

export const alt = 'Party invitation';
export const contentType = 'image/png';
export const size = inviteCardSize('preview');

// Regenerated on the same cadence as the page, so editing the party details
// does not leave a stale picture in circulation.
export const revalidate = 60;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return new Response('Not found', { status: 404 });
  }

  // The preview appears attached to the link itself, which is already
  // tappable — so no printed address here, unlike the downloadable card.
  return renderInviteCard(event, 'preview');
}
