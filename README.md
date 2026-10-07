# A Crop Swap

A neighborhood site for trading backyard fruit and handmade goods using a credit system that lets neighbors give fruit today and redeem it once it ripens.

Built with Vue 3 + Vite, with Supabase for accounts and data. Hosted on Vercel.

## Pages

| Path | Page | Who |
| --- | --- | --- |
| `/` | Landing | everyone |
| `/login`, `/signup`, `/reset-password` | Accounts | everyone |
| `/home` | Backyard Feed: all listings, with search and filters | signed-in members |
| `/post` | Post a Listing, with up to 4 photos | signed-in members |
| `/listings/:id` | Listing Detail: photo gallery; reserve (future) or request an exchange (available now); the poster can edit or remove it and manage its photos | signed-in members |
| `/activity` | My Trades: confirm exchanges, mark ready, confirm pickup, cancel with refund | signed-in members |
| `/profile` | My Backyard: credit balance, your name, your listings | signed-in members |

Members-only pages send signed-out visitors to `/login`, and all of them send `noindex` (a meta tag plus an `X-Robots-Tag` header).

## How credits work

- **Exchange (available now):** a neighbor asks for an item. When the giver and receiver both confirm, the giver earns 1 credit.
- **Reservation (future/ripening):** reserving costs 1 credit right away, and a listing can have only one active reservation. The poster marks it **ready** when it's ripe, and both people confirm pickup to **complete** it.
- **Refunds:** if the reserver cancels, or the poster marks it "won't ripen", the credit goes back and the status becomes **refunded**. Completed reservations are never refunded.
- New neighbors start with **5 credits**, set by the database at sign-up.

All of this is enforced in the database (`supabase/schema.sql`), not in the browser. Nobody can edit a balance directly, and each step is a Postgres function that checks who is calling it.

## Photos

- Up to 4 photos per listing; the first is the cover on the feed and My Backyard. The poster can add, remove, and pick the cover.
- Before upload, the browser resizes each photo to at most 1600 px and re-encodes it as JPEG, which strips location (GPS) and other metadata. JPEG, PNG and WebP originals up to 25 MB are accepted; the stored file must be under 5 MB.
- Files live in the private Supabase Storage bucket `listing-photos` under `<listing id>/`. Only signed-in members can view them, through links that expire after an hour. Only the listing's poster can upload or delete there.
- Removing a listing deletes its photos and files.

## One-time setup

### 1. Supabase

1. Open your Supabase project → **SQL Editor** → New query.
2. Paste all of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It creates the tables, security rules, workflow functions, and the private `listing-photos` storage bucket.
   ⚠️ It drops and recreates the app's tables, so don't re-run it once you have real data. Re-running doesn't delete photo files; empty the bucket in **Storage** if you're starting over.
3. **Authentication → URL Configuration:** set **Site URL** to your Vercel domain (e.g. `https://a-crop-swap.vercel.app`) and add `https://<your-domain>/**` to **Redirect URLs**. Sign-up confirmation and password-reset emails use these.

Accounts created before you ran the schema have no Neighbor record. Either sign up again, or create the missing records in the SQL editor:

```sql
insert into neighbors (managed_by, name)
select id, split_part(email, '@', 1) from auth.users
on conflict do nothing;
```

### 2. Environment variables

`.env` already points at the Supabase project `ndierhgyhbzyorpotqqo`. To use a different project, set these locally in `.env.local`, or in Vercel → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

The anon key is meant to be public. Row-level security decides what each user can see and change.

### 3. Vercel

Import the repo at vercel.com/new and deploy. `vercel.json` sets the build (`npm run build` → `dist`), sends every route to the app, and adds the caching and noindex headers.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
```

### Database tests

`supabase/tests/acceptance.sql` runs the database-level acceptance checks from the blueprint, including photo permissions and the starting balance, against the schema on a throwaway local Postgres:

```bash
npm run test:db    # needs a local Postgres superuser (PGHOST, PGUSER, etc.)
```
