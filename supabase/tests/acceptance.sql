-- Acceptance checks from the blueprint (§7), run against schema.sql.
-- Usage: psql -v ON_ERROR_STOP=1 -f supabase_stub.sql -f ../schema.sql -f acceptance.sql
\set QUIET on
set client_min_messages = warning;

-- Test harness: act as a user, and assert helpers.
create function pg_temp.act_as(p_email text) returns void language plpgsql as $$
begin
  execute 'reset role';
  if p_email is null then
    perform set_config('request.jwt.claim.sub', '', false);
    execute 'set role anon';
  else
    perform set_config('request.jwt.claim.sub', (select id::text from auth.users where email = p_email), false);
    execute 'set role authenticated';
  end if;
end $$;
create function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', label; end if;
  raise notice 'pass  %', label;
end $$;
create function pg_temp.fails(stmt text, label text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'pass  % (%)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % — statement succeeded: %', label, stmt;
end $$;
create function pg_temp.balance(p_email text) returns int language sql security definer as $$
  select n.credit_balance from public.neighbors n join auth.users u on u.id = n.managed_by where u.email = p_email
$$;
create function pg_temp.nid(p_email text) returns uuid language sql security definer as $$
  select n.id from public.neighbors n join auth.users u on u.id = n.managed_by where u.email = p_email
$$;
grant execute on all functions in schema pg_temp to anon, authenticated;
set client_min_messages = notice;

-- Sign up three neighbors (the trigger creates their Neighbor rows).
insert into auth.users (email, raw_user_meta_data) values
  ('jane@example.com', '{"name":"Jane"}'), ('bob@example.com', '{"name":"Bob"}'), ('cara@example.com', '{}');

-- A-13 / A-1 email uniqueness
select pg_temp.fails($$insert into auth.users (email) values ('jane@example.com')$$, 'A-13 duplicate email rejected');
select pg_temp.ok((select count(*) from public.neighbors) = 3, 'RU-3 one neighbor per account, created on signup');
select pg_temp.ok((select name from public.neighbors where id = pg_temp.nid('cara@example.com')) = 'cara', 'name falls back to email prefix');

-- A-53 everyone starts with exactly 5 credits and cannot pick another amount
select pg_temp.ok((select bool_and(credit_balance = 5) from public.neighbors), 'A-53 new neighbors start with 5 credits');
insert into auth.users (email) values ('dan@example.com');
delete from public.neighbors where id = pg_temp.nid('dan@example.com');
select pg_temp.act_as('dan@example.com');
select pg_temp.fails($$insert into public.neighbors (managed_by, name, credit_balance) values (auth.uid(), 'Dan', 50)$$, 'A-53 cannot choose a bigger starting balance');
insert into public.neighbors (managed_by, name) values (auth.uid(), 'Dan');
select pg_temp.ok((select credit_balance from public.neighbors) = 5, 'A-53 self-created neighbor also starts with 5');
reset role;
delete from auth.users where email = 'dan@example.com';

-- Test setup: empty the balances so the credit scenarios below start from 0.
update public.neighbors set credit_balance = 0;

-- A-12 / A-15 own record only
select pg_temp.act_as('jane@example.com');
select pg_temp.ok((select count(*) from public.neighbors) = 1, 'A-15 jane sees only her own neighbor record');
update public.neighbors set name = 'Jane Gardener';
select pg_temp.ok((select name from public.neighbors) = 'Jane Gardener', 'A-12 jane edits her own record');
update public.neighbors set name = 'hacked' where id = pg_temp.nid('bob@example.com');
select pg_temp.ok((select name from public.neighbor_names where id = pg_temp.nid('bob@example.com')) = 'Bob', 'A-15 jane cannot edit bob');
select pg_temp.fails($$update public.neighbors set credit_balance = 99$$, 'A-14 no direct balance edits');
select pg_temp.fails($$insert into public.neighbors (managed_by, name) values (auth.uid(), 'Second')$$, 'RU-3 no second neighbor');
select pg_temp.ok((select count(*) from public.neighbor_names) = 3, 'poster names visible via neighbor_names');

-- A-26 posting
insert into public.listings (title, type, availability, poster_id)
  values ('Plums', 'fruit', 'future', public.current_neighbor_id()),
         ('Lemons', 'fruit', 'available_now', public.current_neighbor_id());
select pg_temp.fails($$insert into public.listings (title, type, availability, poster_id) values ('Fake', 'fruit', 'future', pg_temp.nid('bob@example.com'))$$, 'cannot post as someone else');

-- A-25 feed shows all listings; A-17 non-poster cannot edit
select pg_temp.act_as('bob@example.com');
insert into public.listings (title, type, availability, poster_id) values ('Scarf', 'handmade', 'available_now', public.current_neighbor_id());
select pg_temp.ok((select count(*) from public.listings) = 3, 'A-25 bob sees listings from all neighbors');
update public.listings set title = 'Mine now' where title = 'Plums';
delete from public.listings where title = 'Lemons';
select pg_temp.ok((select count(*) from public.listings where title in ('Plums','Lemons')) = 2, 'A-17 bob cannot edit or remove jane''s listings');

-- A-16 poster edits own
select pg_temp.act_as('jane@example.com');
update public.listings set title = 'Italian Plums' where title = 'Plums';
select pg_temp.ok(exists (select 1 from public.listings where title = 'Italian Plums'), 'A-16 poster edits own listing');

-- A-37 no credits blocks reservation
select pg_temp.act_as('bob@example.com');
select pg_temp.fails($$select public.reserve_listing((select id from public.listings where title = 'Italian Plums'))$$, 'A-37 0 credits cannot reserve');
select pg_temp.ok(pg_temp.balance('bob@example.com') = 0, 'A-37 no credit change');
select pg_temp.fails($$insert into public.reservations (listing_id, reserver_id) values ((select id from public.listings where title = 'Italian Plums'), public.current_neighbor_id())$$, 'no direct reservation inserts');

-- A-18 / A-29 / A-34 / A-35 exchange: jane receives bob's scarf, bob earns a credit
select pg_temp.act_as('jane@example.com');
select pg_temp.fails($$select public.start_exchange((select id from public.listings where title = 'Italian Plums'))$$, 'RU-9 future listing cannot be exchanged directly');
select public.start_exchange((select id from public.listings where title = 'Scarf'));
select pg_temp.ok((select count(*) from public.exchanges) = 1, 'exchange started by receiver');
select public.start_exchange((select id from public.listings where title = 'Scarf'));
select pg_temp.ok((select count(*) from public.exchanges) = 1, 'repeat request reuses open exchange');
select public.confirm_exchange((select id from public.exchanges));
select pg_temp.ok((select receiver_confirmed and not giver_confirmed from public.exchanges), 'A-19 receiver only sets receiverConfirmed');
select pg_temp.fails($$update public.exchanges set giver_confirmed = true$$, 'A-19 no direct confirmation edits');
select pg_temp.ok(pg_temp.balance('bob@example.com') = 0, 'A-35 no credit on partial confirmation');
select pg_temp.act_as('cara@example.com');
select pg_temp.ok((select count(*) from public.exchanges) = 0, 'A-4 outsiders cannot see the exchange');
select pg_temp.fails($$select public.confirm_exchange((select id from public.exchanges limit 1))$$, 'outsider cannot confirm');
select pg_temp.act_as('bob@example.com');
select public.confirm_exchange((select id from public.exchanges));
select pg_temp.ok(pg_temp.balance('bob@example.com') = 1, 'A-18/A-34 giver earns exactly one credit');
select public.confirm_exchange((select id from public.exchanges));
select pg_temp.ok(pg_temp.balance('bob@example.com') = 1, 'RU-14 re-confirming pays nothing extra');

-- A-20 / A-28 / A-36 reserve costs one credit; one active reservation per listing
select public.reserve_listing((select id from public.listings where title = 'Italian Plums'));
select pg_temp.ok(pg_temp.balance('bob@example.com') = 0, 'A-20 credit deducted immediately');
select pg_temp.ok((select status from public.reservations) = 'reserved', 'A-28 reservation is reserved');
select pg_temp.ok(public.listing_has_active_reservation((select id from public.listings where title = 'Italian Plums')), 'listing shows as reserved');
select pg_temp.fails($$select public.mark_reservation_ready((select id from public.reservations))$$, 'RU-18 reserver cannot mark ready');

-- RU-21 second reservation blocked (give cara a credit through an exchange first)
select pg_temp.act_as('cara@example.com');
insert into public.listings (title, type, availability, poster_id) values ('Jam', 'handmade', 'available_now', public.current_neighbor_id());
select pg_temp.act_as('jane@example.com');
select public.start_exchange((select id from public.listings where title = 'Jam'));
select public.confirm_exchange((select id from public.exchanges where giver_id = pg_temp.nid('cara@example.com')));
select pg_temp.act_as('cara@example.com');
select public.confirm_exchange((select id from public.exchanges));
select pg_temp.ok(pg_temp.balance('cara@example.com') = 1, 'cara earned a credit');
select pg_temp.fails($$select public.reserve_listing((select id from public.listings where title = 'Italian Plums'))$$, 'RU-21 only one active reservation');
select pg_temp.ok(pg_temp.balance('cara@example.com') = 1, 'RU-21 blocked reservation costs nothing');

-- RU-18 / RU-19 ready then both confirm pickup → completed
select pg_temp.act_as('jane@example.com');
select pg_temp.ok((select count(*) from public.reservations) = 1, 'A-5 poster sees reservations on her listing');
select pg_temp.fails($$select public.confirm_pickup((select id from public.reservations))$$, 'pickup needs ready first');
select public.mark_reservation_ready((select id from public.reservations));
select public.confirm_pickup((select id from public.reservations));
select pg_temp.ok((select status from public.reservations) = 'ready', 'RU-19 one confirmation is not enough');
select pg_temp.act_as('bob@example.com');
select public.confirm_pickup((select id from public.reservations));
select pg_temp.ok((select status from public.reservations) = 'completed', 'RU-19 both confirmed → completed');

-- A-39 completed reservations are not refunded
select pg_temp.fails($$select public.cancel_reservation((select id from public.reservations))$$, 'A-39 no refund after completion');
select pg_temp.ok(pg_temp.balance('bob@example.com') = 0, 'A-39 balance unchanged');

-- A-21 / A-38 cancel refunds (cara reserves the now-free plums, jane says they never ripened)
select pg_temp.act_as('cara@example.com');
select public.reserve_listing((select id from public.listings where title = 'Italian Plums'));
select pg_temp.ok(pg_temp.balance('cara@example.com') = 0, 'cara spent her credit');
select pg_temp.act_as('jane@example.com');
select public.cancel_reservation((select id from public.reservations where reserver_id = pg_temp.nid('cara@example.com')));
select pg_temp.ok(pg_temp.balance('cara@example.com') = 1, 'A-38 credit refunded to reserver');
select pg_temp.ok((select status from public.reservations where reserver_id = pg_temp.nid('cara@example.com')) = 'refunded', 'A-21 status becomes refunded');
select pg_temp.fails($$select public.cancel_reservation((select id from public.reservations where reserver_id = pg_temp.nid('cara@example.com')))$$, 'no double refund');

-- A-23 / A-27 signed-out visitors get nothing
select pg_temp.act_as(null);
select pg_temp.fails($$select * from public.listings$$, 'A-23 anon cannot read listings');
select pg_temp.fails($$select * from public.neighbors$$, 'A-23 anon cannot read balances');
select pg_temp.fails($$select public.reserve_listing(gen_random_uuid())$$, 'A-27 anon cannot act');

-- ── Listing photos (v1.2.0) ──
reset role;
select pg_temp.ok((select not public and file_size_limit = 5242880 and allowed_mime_types = array['image/jpeg','image/png','image/webp'] from storage.buckets where id = 'listing-photos'), 'A-50 private bucket, 5 MB, JPEG/PNG/WebP only');

select pg_temp.act_as('jane@example.com');
create temp table plum as select id::text as lid from public.listings where title = 'Italian Plums';
grant select on plum to anon, authenticated;
-- A-45 poster uploads files and records them in order
insert into storage.objects (bucket_id, name) select 'listing-photos', lid || '/p' || g || '.jpg' from plum, generate_series(0, 4) g;
insert into public.listing_photos (listing_id, path, position) select lid::uuid, lid || '/p' || g || '.jpg', g from plum, generate_series(0, 3) g;
select pg_temp.ok((select count(*) from public.listing_photos) = 4, 'A-45 poster adds 4 photos');
-- A-46 fifth photo refused
select pg_temp.fails($$insert into public.listing_photos (listing_id, path, position) select lid::uuid, lid || '/p4.jpg', 4 from plum$$, 'A-46 fifth photo refused (position 4)');
select pg_temp.fails($$insert into public.listing_photos (listing_id, path, position) select lid::uuid, lid || '/p4.jpg', 0 from plum$$, 'A-46 fifth photo refused (positions full)');
select pg_temp.fails($$insert into public.listing_photos (listing_id, path, position) select lid::uuid, 'elsewhere/p.jpg', 0 from plum$$, 'photo path must sit in the listing''s folder');
-- reorder: last photo becomes cover
select public.reorder_listing_photos((select lid::uuid from plum),
  array(select id from public.listing_photos order by position desc));
select pg_temp.ok((select path from public.listing_photos where position = 0) like '%/p3.jpg', 'A-45 poster reorders; new cover at position 0');
select pg_temp.fails($$select public.reorder_listing_photos((select lid::uuid from plum), array(select id from public.listing_photos limit 2))$$, 'reorder must include every photo');

-- A-47 non-poster cannot add, remove, reorder or touch files
select pg_temp.act_as('bob@example.com');
select pg_temp.ok((select count(*) from public.listing_photos) = 4, 'RU-36 other members can see the photos');
select pg_temp.ok((select count(*) from storage.objects where bucket_id = 'listing-photos') >= 4, 'RU-36 other members can load the files');
select pg_temp.fails($$insert into public.listing_photos (listing_id, path, position) select l.id, l.id::text || '/x.jpg', 3 from public.listings l where title = 'Italian Plums'$$, 'A-47 non-poster cannot add a photo row');
delete from public.listing_photos;
select pg_temp.ok((select count(*) from public.listing_photos) = 4, 'A-47 non-poster cannot remove photo rows');
select pg_temp.fails($$select public.reorder_listing_photos((select id from public.listings where title = 'Italian Plums'), array(select id from public.listing_photos))$$, 'A-47 non-poster cannot reorder');
select pg_temp.fails($$update public.listing_photos set position = 0$$, 'A-47 no direct position edits');
select pg_temp.fails($$insert into storage.objects (bucket_id, name) select 'listing-photos', id::text || '/evil.jpg' from public.listings where title = 'Italian Plums'$$, 'A-47 non-poster cannot upload into the listing folder');
delete from storage.objects where bucket_id = 'listing-photos';
select pg_temp.ok((select count(*) from storage.objects where bucket_id = 'listing-photos') = 5, 'A-47 non-poster cannot delete files');

-- A-48 signed-out visitors see nothing
select pg_temp.act_as(null);
select pg_temp.fails($$select * from public.listing_photos$$, 'A-48 anon cannot read photo rows');
select pg_temp.ok((select count(*) from storage.objects) = 0, 'A-48 anon cannot see any files');

-- A-52 removing a listing removes its photo rows; the poster may delete its files
select pg_temp.act_as('jane@example.com');
delete from storage.objects where bucket_id = 'listing-photos';
select pg_temp.ok((select count(*) from storage.objects where bucket_id = 'listing-photos') = 0, 'A-52 poster deletes the listing''s files');
delete from public.listings where title = 'Italian Plums';
select pg_temp.ok((select count(*) from public.listing_photos) = 0, 'A-52 removing a listing removes its photo rows');

reset role;
\echo 'ALL ACCEPTANCE CHECKS PASSED'
