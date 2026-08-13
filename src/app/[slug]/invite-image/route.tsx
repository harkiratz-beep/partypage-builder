import { getEventBySlug } from '@/lib/queries';
import { renderInviteCard } from '@/lib/invite-card';
import { env } from '@/lib/env';

/**
 * The downloadable invite picture — the thing a host actually attaches in
 * WhatsApp, as opposed to the link preview.
 *
 * Portrait, because a tall image fills a phone screen in a chat while a wide
 * one shows up as a thin strip. Served as an attachment so tapping the button
 * saves a file instead of opening a new tab.
 */

export const revalidate = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  // RLS hides drafts from the anonymous client, so an unpublished party
  // cannot leak an invite image either.
  if (!event) return new Response('Not found', { status: 404 });

  // The address printed on the card. Taken from the request when possible, so
  // a preview domain prints its own URL rather than the production one.
  const origin = new URL(request.url).origin || env.siteUrl;
  const image = renderInviteCard(event, 'portrait', `${origin}/${slug}`);

  const headers = new Headers(image.headers);
  headers.set('Content-Disposition', `attachment; filename="${slug}-invite.png"`);

  return new Response(image.body, { status: image.status, headers });
}
