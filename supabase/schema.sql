-- A Crop Swap — database schema for Supabase (Postgres).
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- Re-running drops and recreates the app's tables, deleting all app data. Photo files already in
-- the "listing-photos" bucket are not deleted; empty the bucket in Dashboard → Storage if you reset.
--
-- Blueprint mapping
--   D-1 User         → auth.users (Supabase Auth; email is unique app-wide)
--   D-2 Neighbor     → public.neighbors   (one per user, created automatically on signup)
--   D-3 Listing      → public.listings
--   D-4 Exchange     → public.exchanges
--   D-5 Reservation  → public.reservations
--   D-6 Listing Photo → public.listing_photos + private storage bucket "listing-photos"
--   W-1/W-2/W-3      → the security-definer functions at the bottom
--
-- New neighbors start with 5 credits (blueprint v1.2.0).
-- Credits never change through a direct table write: authenticated users have no
-- UPDATE grant on neighbors.credit_balance, and every credit movement happens inside
-- one of the functions below (RU-4).

-- ─── Reset ────────────────────────────────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.listing_photos cascade;
drop table if exists public.reservations cascade;
drop table if exists public.exchanges cascade;
drop table if exists public.listings cascade;
drop table if exists public.neighbors cascade;
drop view if exists public.neighbor_names cascade;
drop type if exists public.listing_type cascade;
drop type if exists public.listing_availability cascade;
drop type if exists public.reservation_status cascade;

-- ─── Types ────────────────────────────────────────────────────────────────────
create type public.listing_type as enum ('fruit', 'handmade');
create type public.listing_availability as enum ('available_now', 'future');
create type public.reservation_status as enum ('reserved', 'ready', 'completed', 'cancelled', 'refunded');

-- ─── Tables ───────────────────────────────────────────────────────────────────
create table public.neighbors (
  id             uuid primary key default gen_random_uuid(),
  managed_by     uuid not null unique references auth.users (id) on delete cascade,
  name           text not null check (length(trim(name)) > 0),
  role           text not null default 'neighbor' check (role = 'neighbor'),
  credit_balance integer not null default 5 check (credit_balance >= 0),
  created_at     timestamptz not null default now()
);

create table public.listings (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(trim(title)) > 0),
  description  text,
  type         public.listing_type not null,
  availability public.listing_availability not null,
  poster_id    uuid not null references public.neighbors (id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index listings_poster_idx on public.listings (poster_id);

create table public.exchanges (
  id                 uuid primary key default gen_random_uuid(),
  listing_id         uuid not null references public.listings (id) on delete cascade,
  giver_id           uuid not null references public.neighbors (id) on delete cascade,
  receiver_id        uuid not null references public.neighbors (id) on delete cascade,
  giver_confirmed    boolean not null default false,
  receiver_confirmed boolean not null default false,
  credited           boolean not null default false, -- guards W-1 so the credit is paid exactly once
  created_at         timestamptz not null default now(),
  check (giver_id <> receiver_id)
);
create index exchanges_giver_idx on public.exchanges (giver_id);
create index exchanges_receiver_idx on public.exchanges (receiver_id);

create table public.reservations (
  id                 uuid primary key default gen_random_uuid(),
  listing_id         uuid not null references public.listings (id) on delete cascade,
  reserver_id        uuid not null references public.neighbors (id) on delete cascade,
  status             public.reservation_status not null default 'reserved',
  poster_confirmed   boolean not null default false, -- pickup confirmations (RU-19)
  reserver_confirmed boolean not null default false,
  created_at         timestamptz not null default now()
);
create index reservations_reserver_idx on public.reservations (reserver_id);
-- RU-21: only one active reservation per listing.
create unique index reservations_one_active_per_listing
  on public.reservations (listing_id) where status in ('reserved', 'ready');

-- D-6: up to 4 photos per listing (positions 0-3, unique per listing); position 0 is the cover.
create table public.listing_photos (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  path       text not null unique,
  position   smallint not null check (position between 0 and 3),
  created_at timestamptz not null default now(),
  constraint listing_photos_one_per_position unique (listing_id, position) deferrable initially immediate,
  check (path like listing_id::text || '/%')
);

-- ─── Helpers ──────────────────────────────────────────────────────────────────
create or replace function public.current_neighbor_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.neighbors where managed_by = auth.uid()
$$;

-- Names only, so feeds can show who posted without exposing anyone's balance.
create view public.neighbor_names with (security_barrier) as
  select id, name from public.neighbors;

-- Create the Neighbor record for every new account (RU-3: one neighbor, one balance).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.neighbors (managed_by, name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row-level security ───────────────────────────────────────────────────────
alter table public.neighbors    enable row level security;
alter table public.listings     enable row level security;
alter table public.exchanges    enable row level security;
alter table public.reservations enable row level security;
alter table public.listing_photos enable row level security;

revoke all on public.neighbors, public.listings, public.exchanges, public.reservations, public.listing_photos from anon, authenticated;
revoke all on public.neighbor_names from anon, authenticated;

-- Neighbors: read and edit only your own record (RU-1, RU-6, A-15); only the name is editable.
grant select, insert on public.neighbors to authenticated;
grant update (name) on public.neighbors to authenticated;
grant select on public.neighbor_names to authenticated;

create policy "neighbors: read own" on public.neighbors
  for select to authenticated using (managed_by = auth.uid());
create policy "neighbors: create own" on public.neighbors
  for insert to authenticated with check (managed_by = auth.uid() and credit_balance = 5);
create policy "neighbors: edit own" on public.neighbors
  for update to authenticated using (managed_by = auth.uid()) with check (managed_by = auth.uid());

-- Listings: every signed-in member sees the whole feed (A-25); only the poster edits or removes (RU-8).
grant select, insert, delete on public.listings to authenticated;
grant update (title, description, type, availability) on public.listings to authenticated;

create policy "listings: signed-in members read all" on public.listings
  for select to authenticated using (true);
create policy "listings: post as yourself" on public.listings
  for insert to authenticated with check (poster_id = public.current_neighbor_id());
create policy "listings: poster edits" on public.listings
  for update to authenticated
  using (poster_id = public.current_neighbor_id())
  with check (poster_id = public.current_neighbor_id());
create policy "listings: poster removes" on public.listings
  for delete to authenticated using (poster_id = public.current_neighbor_id());

-- Exchanges and reservations: participants read; all writes go through the functions below.
grant select on public.exchanges, public.reservations to authenticated;

create policy "exchanges: participants read" on public.exchanges
  for select to authenticated
  using (public.current_neighbor_id() in (giver_id, receiver_id));

create policy "reservations: reserver and poster read" on public.reservations
  for select to authenticated
  using (
    reserver_id = public.current_neighbor_id()
    or exists (select 1 from public.listings l
               where l.id = listing_id and l.poster_id = public.current_neighbor_id())
  );

-- Listing photos: every signed-in member sees them; only the listing's poster adds or removes (RU-34, RU-36).
-- Reordering goes through reorder_listing_photos below.
grant select, insert, delete on public.listing_photos to authenticated;

create policy "photos: signed-in members read all" on public.listing_photos
  for select to authenticated using (true);
create policy "photos: poster adds" on public.listing_photos
  for insert to authenticated
  with check (exists (select 1 from public.listings l
                      where l.id = listing_id and l.poster_id = public.current_neighbor_id()));
create policy "photos: poster removes" on public.listing_photos
  for delete to authenticated
  using (exists (select 1 from public.listings l
                 where l.id = listing_id and l.poster_id = public.current_neighbor_id()));

-- ─── Photo storage ────────────────────────────────────────────────────────────
-- Private bucket: no public links; signed-in members get short-lived signed URLs (RU-36).
-- Uploads are already resized JPEGs from the browser; the bucket still enforces type and size (RU-38).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files live at <listing id>/<photo id>.jpg; only that listing's poster may write or delete there.
create or replace function public.is_listing_poster(p_folder text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.listings
                 where id::text = p_folder and poster_id = public.current_neighbor_id())
$$;

drop policy if exists "listing photos: members read" on storage.objects;
drop policy if exists "listing photos: poster uploads" on storage.objects;
drop policy if exists "listing photos: poster deletes" on storage.objects;

create policy "listing photos: members read" on storage.objects
  for select to authenticated using (bucket_id = 'listing-photos');
create policy "listing photos: poster uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos' and public.is_listing_poster((storage.foldername(name))[1]));
create policy "listing photos: poster deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and public.is_listing_poster((storage.foldername(name))[1]));

-- ─── Workflows ────────────────────────────────────────────────────────────────

-- Is someone already holding this listing? (Visible to everyone, without revealing who.)
create or replace function public.listing_has_active_reservation(p_listing_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.reservations
                 where listing_id = p_listing_id and status in ('reserved', 'ready'))
$$;

-- Start a direct exchange on an available_now listing: the poster gives, the caller receives.
create or replace function public.start_exchange(p_listing_id uuid)
returns public.exchanges language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.current_neighbor_id();
  l  public.listings;
  ex public.exchanges;
begin
  if me is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into l from public.listings where id = p_listing_id;
  if not found then raise exception 'Listing not found'; end if;
  if l.availability <> 'available_now' then
    raise exception 'Only available-now listings use direct exchange; reserve future listings instead';
  end if;
  if l.poster_id = me then raise exception 'You cannot trade with yourself'; end if;

  select * into ex from public.exchanges
   where listing_id = p_listing_id and receiver_id = me and not credited;
  if found then return ex; end if; -- reuse your open exchange instead of creating duplicates

  insert into public.exchanges (listing_id, giver_id, receiver_id)
  values (p_listing_id, l.poster_id, me)
  returning * into ex;
  return ex;
end;
$$;

-- W-1: each side confirms only its own flag (RU-12); when both are true the giver earns one credit (RU-13, RU-14).
create or replace function public.confirm_exchange(p_exchange_id uuid)
returns public.exchanges language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.current_neighbor_id();
  ex public.exchanges;
begin
  select * into ex from public.exchanges where id = p_exchange_id for update;
  if not found then raise exception 'Exchange not found'; end if;

  if me = ex.giver_id then
    update public.exchanges set giver_confirmed = true where id = ex.id returning * into ex;
  elsif me = ex.receiver_id then
    update public.exchanges set receiver_confirmed = true where id = ex.id returning * into ex;
  else
    raise exception 'Only the giver or receiver can confirm this exchange' using errcode = '42501';
  end if;

  if ex.giver_confirmed and ex.receiver_confirmed and not ex.credited then
    update public.neighbors set credit_balance = credit_balance + 1 where id = ex.giver_id;
    update public.exchanges set credited = true where id = ex.id returning * into ex;
  end if;
  return ex;
end;
$$;

-- W-2: reserving a future listing costs one credit, deducted immediately (RU-17, RU-21).
create or replace function public.reserve_listing(p_listing_id uuid)
returns public.reservations language plpgsql security definer set search_path = public as $$
declare
  me  uuid := public.current_neighbor_id();
  l   public.listings;
  bal integer;
  r   public.reservations;
begin
  if me is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into l from public.listings where id = p_listing_id;
  if not found then raise exception 'Listing not found'; end if;
  if l.availability <> 'future' then
    raise exception 'Only future listings can be reserved; use direct exchange for available-now items';
  end if;
  if l.poster_id = me then raise exception 'You cannot reserve your own listing'; end if;

  select credit_balance into bal from public.neighbors where id = me for update;
  if bal < 1 then raise exception 'You need at least 1 credit to reserve. Give something first to earn one.'; end if;

  begin
    insert into public.reservations (listing_id, reserver_id) values (p_listing_id, me) returning * into r;
  exception when unique_violation then
    raise exception 'Someone has already reserved this listing';
  end;
  update public.neighbors set credit_balance = credit_balance - 1 where id = me;
  return r;
end;
$$;

-- Poster marks a reservation ready when the fruit ripens (RU-18).
create or replace function public.mark_reservation_ready(p_reservation_id uuid)
returns public.reservations language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.current_neighbor_id();
  r  public.reservations;
  poster uuid;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found'; end if;
  select poster_id into poster from public.listings where id = r.listing_id;
  if poster is distinct from me then
    raise exception 'Only the listing''s poster can mark it ready' using errcode = '42501';
  end if;
  if r.status <> 'reserved' then raise exception 'Only reserved items can be marked ready'; end if;
  update public.reservations set status = 'ready' where id = r.id returning * into r;
  return r;
end;
$$;

-- Both poster and reserver confirm pickup; the second confirmation completes it (RU-19).
create or replace function public.confirm_pickup(p_reservation_id uuid)
returns public.reservations language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.current_neighbor_id();
  r  public.reservations;
  poster uuid;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found'; end if;
  if r.status <> 'ready' then raise exception 'Pickup can be confirmed once the poster marks it ready'; end if;
  select poster_id into poster from public.listings where id = r.listing_id;

  if me = poster then
    update public.reservations set poster_confirmed = true where id = r.id returning * into r;
  elsif me = r.reserver_id then
    update public.reservations set reserver_confirmed = true where id = r.id returning * into r;
  else
    raise exception 'Only the poster or reserver can confirm pickup' using errcode = '42501';
  end if;

  if r.poster_confirmed and r.reserver_confirmed then
    update public.reservations set status = 'completed' where id = r.id returning * into r;
  end if;
  return r;
end;
$$;

-- W-3: cancelling (by the reserver) or "never ripened" (by the poster) refunds the credit (RU-20).
-- Completed or already-refunded reservations are never refunded again (A-39).
create or replace function public.cancel_reservation(p_reservation_id uuid)
returns public.reservations language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.current_neighbor_id();
  r  public.reservations;
  poster uuid;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found'; end if;
  select poster_id into poster from public.listings where id = r.listing_id;
  if me is distinct from r.reserver_id and me is distinct from poster then
    raise exception 'Only the poster or reserver can cancel this reservation' using errcode = '42501';
  end if;
  if r.status not in ('reserved', 'ready') then
    raise exception 'This reservation is already %', r.status;
  end if;

  update public.neighbors set credit_balance = credit_balance + 1 where id = r.reserver_id;
  update public.reservations set status = 'refunded' where id = r.id returning * into r;
  return r;
end;
$$;

-- Poster sets the photo order; the first id becomes the cover (RU-34, RU-35).
create or replace function public.reorder_listing_photos(p_listing_id uuid, p_photo_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare
  i integer;
begin
  if not exists (select 1 from public.listings
                 where id = p_listing_id and poster_id = public.current_neighbor_id()) then
    raise exception 'Only the listing''s poster can reorder its photos' using errcode = '42501';
  end if;
  if (select count(*) from public.listing_photos where listing_id = p_listing_id) <> coalesce(array_length(p_photo_ids, 1), 0)
     or (select count(distinct x) from unnest(p_photo_ids) as x) <> coalesce(array_length(p_photo_ids, 1), 0)
     or exists (select 1 from unnest(p_photo_ids) as x(id)
                where not exists (select 1 from public.listing_photos p where p.id = x.id and p.listing_id = p_listing_id)) then
    raise exception 'The new order must list each of this listing''s photos exactly once';
  end if;
  set constraints public.listing_photos_one_per_position deferred;
  for i in 1 .. array_length(p_photo_ids, 1) loop
    update public.listing_photos set position = i - 1 where id = p_photo_ids[i];
  end loop;
end;
$$;

revoke execute on function
  public.current_neighbor_id(),
  public.is_listing_poster(text),
  public.reorder_listing_photos(uuid, uuid[]),
  public.handle_new_user(),
  public.listing_has_active_reservation(uuid),
  public.start_exchange(uuid),
  public.confirm_exchange(uuid),
  public.reserve_listing(uuid),
  public.mark_reservation_ready(uuid),
  public.confirm_pickup(uuid),
  public.cancel_reservation(uuid)
from public, anon, authenticated;
grant execute on function
  public.current_neighbor_id(),
  public.is_listing_poster(text),
  public.reorder_listing_photos(uuid, uuid[]),
  public.listing_has_active_reservation(uuid),
  public.start_exchange(uuid),
  public.confirm_exchange(uuid),
  public.reserve_listing(uuid),
  public.mark_reservation_ready(uuid),
  public.confirm_pickup(uuid),
  public.cancel_reservation(uuid)
to authenticated;
