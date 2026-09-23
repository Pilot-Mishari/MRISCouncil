# Activities feature — integration guide

This adds an "Activities" section where staff can create activities (football
tournament, basketball league, etc.), and add/update fixtures and results.
Everyone can browse `/activities`; only signed-in staff can manage things
under `/staff/activities`.

## What's in here

- `supabase/migrations/20260923_activities.sql` — creates `activities` and
  `fixtures` tables with row-level security (public read, authenticated write).
- `lib/types/activities.ts` — shared TypeScript types.
- `lib/activities/queries.ts` — read-only data fetching.
- `lib/activities/actions.ts` — server actions for create/update/delete,
  gated by `requireStaff()`.
- `app/activities/page.tsx` and `app/activities/[id]/page.tsx` — public pages.
- `app/staff/activities/page.tsx` and `app/staff/activities/[id]/page.tsx` —
  staff-only management pages.

## Steps to wire it up

1. **Run the migration.** Paste `supabase/migrations/20260923_activities.sql`
   into your Supabase project's SQL Editor and run it (or add it to your
   `supabase/migrations` folder if you use the CLI).

2. **Fix the import path.** All the new files import your Supabase server
   client from `@/lib/supabase/server`. If your existing client lives
   somewhere else, update the import at the top of `lib/activities/queries.ts`
   and `lib/activities/actions.ts` to match.

3. **Tighten the staff check.** `requireStaff()` in `lib/activities/actions.ts`
   currently only checks that someone is signed in. If you have a staff/role
   table (e.g. a `profiles.role` column), uncomment and adapt the TODO block
   there so random logged-in visitors can't create activities — and do the
   same in the RLS policies in the SQL file. Also update the `redirect("/login")`
   line to point at your actual staff sign-in route.

4. **Copy the files in.** Drop the `lib/` and `app/` folders into your repo,
   merging with what's already there (don't overwrite existing files with the
   same name — merge by hand if any paths collide).

5. **Add navigation.** Link to `/activities` from your public nav, and link to
   `/staff/activities` from wherever your staff already sign in (e.g. a staff
   dashboard).

6. **Test locally**: `npm run dev`, then visit `/staff/activities` while signed
   in to create an activity, add a fixture, and record a result — then check
   it shows up at `/activities`.

## How it works

- An **activity** is the tournament/competition itself (title, type, status).
- Each activity has many **fixtures** — a match with two teams, a date, and a
  status (`scheduled`, `completed`, `postponed`, `cancelled`).
- Staff add fixtures ahead of time (upcoming matches), then come back and
  enter the score once played, which flips it into "Results" on the public
  page automatically.
- The `type` field is a free-text string, so staff can use "football",
  "basketball", "chess club", etc. — no code changes needed for new activity
  types.
