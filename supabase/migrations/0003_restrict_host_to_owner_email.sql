-- The original host policies were `to authenticated using (true)`, which means
-- ANY signed-in user is a host. Supabase allows self-signup via magic link, so
-- a stranger could sign up and read the whole guest list (names + mobiles) or
-- delete events. Restrict host access to a known email instead.
--
-- To add another host later, extend the array in public.is_host().

create or replace function public.is_host()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') = any (array['harkiratz@gmail.com']);
$$;

revoke all on function public.is_host() from public;
grant execute on function public.is_host() to authenticated, anon;

drop policy if exists "events: hosts do anything" on public.events;
create policy "events: hosts do anything"
  on public.events for all to authenticated
  using (public.is_host()) with check (public.is_host());

drop policy if exists "rsvps: hosts do anything" on public.rsvps;
create policy "rsvps: hosts do anything"
  on public.rsvps for all to authenticated
  using (public.is_host()) with check (public.is_host());

drop policy if exists "updates: hosts do anything" on public.updates;
create policy "updates: hosts do anything"
  on public.updates for all to authenticated
  using (public.is_host()) with check (public.is_host());

drop policy if exists "gallery: hosts do anything" on public.gallery_images;
create policy "gallery: hosts do anything"
  on public.gallery_images for all to authenticated
  using (public.is_host()) with check (public.is_host());
