-- PartyPage Builder — schema, constraints and row-level security.
-- Run in the Supabase SQL editor, or `supabase db push`.

create extension if not exists "pgcrypto";

-- ============================================================== events
create table public.events (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  child_name         text not null,
  age                integer check (age >= 0 and age <= 120),
  date               date,
  start_time         time,
  end_time           time,
  venue_name         text,
  venue_address      text,
  maps_url           text,
  rsvp_phone         text,
  host_message       text,
  thank_you_message  text,
  status             text not null default 'draft'
                       check (status in ('draft', 'published', 'completed')),
  theme_id           text not null default 'default',
  hero_image_url     text,
  hero_image_opacity numeric not null default 0.18
                       check (hero_image_opacity between 0 and 1),
  created_at         timestamptz not null default now(),

  -- An event can only go live with the things a guest needs.
  constraint events_publishable check (
    status = 'draft'
    or (date is not null and start_time is not null and venue_name is not null)
  )
);

-- The admin list is "everything, newest first"; the guest page is by slug
-- (already covered by the unique constraint).
create index events_created_idx on public.events (created_at desc);

-- =============================================================== rsvps
create table public.rsvps (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  guest_name   text not null check (length(trim(guest_name)) >= 2),
  mobile       text not null,
  attending    boolean not null,
  guest_count  integer not null default 0 check (guest_count between 0 and 30),
  note         text,
  submitted_at timestamptz not null default now()
);

create index rsvps_event_idx on public.rsvps (event_id, submitted_at desc);

-- One response per phone number per event. Lets a guest correct their answer
-- (the app upserts) instead of the host getting three conflicting rows.
create unique index rsvps_event_mobile_idx on public.rsvps (event_id, mobile);

-- ============================================================= updates
create table public.updates (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  type       text not null default 'info' check (type in ('info', 'reminder', 'change')),
  title      text not null,
  message    text not null,
  active     boolean not null default true,
  pinned     boolean not null default false,
  created_at timestamptz not null default now()
);

-- Matches the read: pinned first, then newest.
create index updates_event_idx on public.updates (event_id, pinned desc, created_at desc);

-- ====================================================== gallery_images
create table public.gallery_images (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  image_url  text not null,
  caption    text,
  category   text default 'party',
  sort_order integer not null default 0,
  visible    boolean not null default true
);

create index gallery_event_idx on public.gallery_images (event_id, sort_order);

-- ================================================================= RLS
-- Guests are anonymous (the `anon` role). They may read live events and
-- record one RSVP. Hosts are any signed-in user.
--
-- Single-tenant on purpose: one family, one login. For multiple hosts add
--   alter table public.events add column owner_id uuid references auth.users;
-- and change the host policies to `owner_id = auth.uid()`.

alter table public.events         enable row level security;
alter table public.rsvps          enable row level security;
alter table public.updates        enable row level security;
alter table public.gallery_images enable row level security;

-- events -------------------------------------------------------------
create policy "events: guests read live ones"
  on public.events for select to anon
  using (status in ('published', 'completed'));

create policy "events: hosts do anything"
  on public.events for all to authenticated
  using (true) with check (true);

-- rsvps ---------------------------------------------------------------
-- NOTE: guest INSERT/UPDATE policies were replaced by the submit_rsvp()
-- function in 0002 — see that file for why.

create policy "rsvps: hosts do anything"
  on public.rsvps for all to authenticated
  using (true) with check (true);

-- updates --------------------------------------------------------------
create policy "updates: guests read active ones on live events"
  on public.updates for select to anon
  using (
    active and exists (select 1 from public.events e
                       where e.id = event_id and e.status in ('published', 'completed'))
  );

create policy "updates: hosts do anything"
  on public.updates for all to authenticated
  using (true) with check (true);

-- gallery_images --------------------------------------------------------
create policy "gallery: guests read visible ones on live events"
  on public.gallery_images for select to anon
  using (
    visible and exists (select 1 from public.events e
                        where e.id = event_id and e.status in ('published', 'completed'))
  );

create policy "gallery: hosts do anything"
  on public.gallery_images for all to authenticated
  using (true) with check (true);

-- ============================================================= storage
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

create policy "event images: public read"
  on storage.objects for select to anon
  using (bucket_id = 'event-images');

create policy "event images: hosts write"
  on storage.objects for all to authenticated
  using (bucket_id = 'event-images')
  with check (bucket_id = 'event-images');
