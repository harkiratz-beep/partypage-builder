import { ImageResponse } from 'next/og';
import { formatDateLong, formatTimeRange } from './format';
import type { Event } from './types';

/**
 * The invite as a picture.
 *
 * Two shapes come out of the same layout:
 *   'portrait' (1080×1350) — the file a host downloads and sends in WhatsApp
 *                            as an image. Tall, because that is what fills a
 *                            phone screen in a chat.
 *   'preview'  (1200×630)  — the OpenGraph thumbnail WhatsApp, iMessage and
 *                            friends show when the *link* is pasted. Wide,
 *                            because that is the box they render it in.
 *
 * Rendered by satori (via next/og), which is not a browser: every container
 * with more than one child needs an explicit display:flex, there is no
 * cascade worth relying on, and only a small slice of CSS is supported. Hence
 * the very literal inline styles below.
 */

export type CardShape = 'portrait' | 'preview';

const SIZES: Record<CardShape, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1350 },
  preview: { width: 1200, height: 630 },
};

/** Matches --hero in globals.css, so the picture and the page agree. */
const GRADIENT = 'linear-gradient(150deg, #f97316, #c2410c 55%, #7c2d12)';

export function inviteCardSize(shape: CardShape) {
  return SIZES[shape];
}

export function renderInviteCard(
  event: Event,
  shape: CardShape,
  inviteUrl?: string,
): ImageResponse {
  const { width, height } = SIZES[shape];
  const portrait = shape === 'portrait';

  // In portrait the photo is a tall band across the top with the details
  // underneath. In the wide preview they sit side by side, or the details take
  // the whole frame when there is no photo.
  const scale = portrait ? 1 : 0.72;
  const px = (value: number) => Math.round(value * scale);

  const details = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
        padding: `${px(56)}px ${px(64)}px`,
        backgroundColor: '#fffaf5',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: px(26),
          letterSpacing: px(6),
          fontWeight: 700,
          color: '#c2410c',
        }}
      >
        YOU&apos;RE INVITED
      </div>

      <div
        style={{
          display: 'flex',
          marginTop: px(18),
          fontSize: px(84),
          fontWeight: 700,
          color: '#1c1917',
          lineHeight: 1,
        }}
      >
        {event.child_name}
      </div>

      {event.age !== null && (
        <div style={{ display: 'flex', marginTop: px(14), fontSize: px(38), color: '#78716c' }}>
          is turning {event.age}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          marginTop: px(34),
          height: px(4),
          width: px(120),
          backgroundColor: '#f97316',
        }}
      />

      <div style={{ display: 'flex', marginTop: px(34), fontSize: px(34), color: '#1c1917' }}>
        {formatDateLong(event.date)}
      </div>

      {event.start_time && (
        <div style={{ display: 'flex', marginTop: px(10), fontSize: px(34), color: '#1c1917' }}>
          {formatTimeRange(event.start_time, event.end_time)}
        </div>
      )}

      {event.venue_name && (
        <div
          style={{
            display: 'flex',
            marginTop: px(10),
            fontSize: px(34),
            fontWeight: 700,
            color: '#1c1917',
          }}
        >
          {event.venue_name}
        </div>
      )}

      {event.venue_address && (
        <div style={{ display: 'flex', marginTop: px(6), fontSize: px(26), color: '#78716c' }}>
          {event.venue_address}
        </div>
      )}

      {/*
        Nothing on a picture is tappable — it is a photo in a chat, not a web
        page. So the card prints the address itself, big enough to read off a
        screen and type in, rather than telling people to tap something that
        cannot be tapped.
      */}
      {inviteUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: px(38) }}>
          <div style={{ display: 'flex', fontSize: px(22), color: '#a8a29e' }}>
            RSVP at
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: px(6),
              fontSize: px(24),
              fontWeight: 700,
              color: '#c2410c',
            }}
          >
            {inviteUrl.replace(/^https?:\/\//, '')}
          </div>
        </div>
      )}
    </div>
  );

  const photoBox = {
    width: portrait ? width : Math.round(width * 0.42),
    height: portrait ? Math.round(height * 0.52) : height,
  };

  const photo = event.hero_image_url ? (
    // 'contain', not 'cover': the whole photo has to be visible. Cropping to
    // fill the box quietly cut the top and bottom off tall pictures — heads
    // included. The gradient behind fills whatever space the photo does not.
    <div
      style={{
        display: 'flex',
        ...photoBox,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: GRADIENT,
      }}
    >
      <img
        src={event.hero_image_url}
        alt=""
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </div>
  ) : (
    // No photo: a plain band of the theme gradient keeps the composition.
    <div
      style={{
        display: 'flex',
        width: portrait ? width : Math.round(width * 0.42),
        height: portrait ? Math.round(height * 0.34) : height,
        backgroundImage: GRADIENT,
      }}
    />
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: portrait ? 'column' : 'row',
          width,
          height,
          backgroundColor: '#fffaf5',
        }}
      >
        {photo}
        {details}
      </div>
    ),
    { width, height },
  );
}
