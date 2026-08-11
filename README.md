# PartyPage Builder

A reusable birthday-party microsite. One mobile-first link you can drop into
WhatsApp: details, directions, RSVPs, updates and photos.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · Supabase · Netlify

## Routes

| Route | Who | Notes |
|---|---|---|
| `/` | anyone | lists published invites |
| `/[slug]` | guests | the invite + RSVP form |
| `/admin` | host | event list (auth required) |
| `/admin/new` | host | create an event |
| `/login` | host | magic-link sign-in |

## Local setup

```bash
npm install
cp .env.example .env.local     # fill in your Supabase URL + anon key
npm run dev
```

Apply the database schema by running the files in `supabase/migrations/`
in order, via the Supabase SQL editor or `supabase db push`.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (public by design — RLS protects the data) |
| `NEXT_PUBLIC_SITE_URL` | your real origin, used for share links |

Never add a service-role key. Row Level Security is what protects the data.

## How the data layer is arranged

- `lib/queries.ts` — guest reads through a **cookie-free** client, so `/[slug]`
  stays cacheable (`revalidate = 60`).
- `lib/admin-queries.ts` — host reads through the cookie client, so drafts are visible.
- `lib/event-actions.ts`, `lib/rsvp-actions.ts` — all writes, as Server Actions.
- Validation lives in its own modules so the client form and the server action
  share one copy. (A `'use server'` file may only export async functions.)

### Why RSVPs go through a database function

Guests must be able to reply, and to correct a reply, but must never read the
guest list — so `anon` has no SELECT policy on `rsvps`. That rules out both
`.insert().select()` (needs SELECT for `RETURNING`) and `.upsert()` (needs
SELECT to resolve `ON CONFLICT`). Writes therefore go through
`public.submit_rsvp()`, a `SECURITY DEFINER` function that returns void,
re-checks the event is published, and upserts on `(event_id, mobile)`.

## Deploying to Netlify

1. Import this repo (Netlify detects Next.js; `netlify.toml` is included).
2. Add the three environment variables above.
3. Deploy, then add the deployed URL to Supabase → Authentication → URL
   Configuration, or host sign-in will fail.

## Not built yet

Editing an event, and admin UI for writing updates and gallery photos —
both are currently read-only in the app.
