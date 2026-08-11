-- Guests must be able to RSVP and correct an earlier reply, but must never be
-- able to read the guest list. Direct INSERT can't do both:
--   * INSERT .. RETURNING (what .insert().select() emits) needs a SELECT policy
--   * ON CONFLICT DO UPDATE has to read the conflicting row, same requirement
-- Granting anon SELECT on rsvps would expose every guest's name and number.
--
-- So the write goes through one SECURITY DEFINER function that returns void.

create or replace function public.submit_rsvp(
  p_event_id    uuid,
  p_guest_name  text,
  p_mobile      text,
  p_attending   boolean,
  p_guest_count integer,
  p_note        text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mobile text := regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g');
begin
  -- SECURITY DEFINER bypasses RLS, so re-check what the policy used to enforce.
  if not exists (
    select 1 from public.events where id = p_event_id and status = 'published'
  ) then
    raise exception 'This event is not accepting RSVPs.' using errcode = 'check_violation';
  end if;

  if length(trim(coalesce(p_guest_name, ''))) < 2 then
    raise exception 'A name is required.' using errcode = 'check_violation';
  end if;

  if length(v_mobile) < 10 then
    raise exception 'A valid mobile number is required.' using errcode = 'check_violation';
  end if;

  insert into public.rsvps (event_id, guest_name, mobile, attending, guest_count, note)
  values (
    p_event_id, trim(p_guest_name), v_mobile, p_attending,
    case when p_attending then greatest(1, least(30, coalesce(p_guest_count, 1))) else 0 end,
    nullif(trim(coalesce(p_note, '')), '')
  )
  on conflict (event_id, mobile) do update
    set guest_name   = excluded.guest_name,
        attending    = excluded.attending,
        guest_count  = excluded.guest_count,
        note         = excluded.note,
        submitted_at = now();
end;
$$;

revoke all on function public.submit_rsvp(uuid, text, text, boolean, integer, text) from public;
grant execute on function public.submit_rsvp(uuid, text, text, boolean, integer, text) to anon, authenticated;

-- Guests no longer touch the table directly.
drop policy if exists "rsvps: guests may reply" on public.rsvps;
drop policy if exists "rsvps: guests may correct their reply" on public.rsvps;
