# Campione Field

Job closeout, quality control, time capture, and progress photos for Campione crews.
Installs to a phone home screen. Works offline.

## Deploy

1. Push this folder to a GitHub repo in Jorge's account.
2. Vercel -> New Project -> import the repo.
3. Add two environment variables (Settings -> Environment Variables):

   NEXT_PUBLIC_SUPABASE_URL   = https://nyxeunyilkwtdznpwcwr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (anon public key from Supabase -> Settings -> API)

4. Deploy.
5. Vercel -> Settings -> Domains -> add  app.campionehomeservices.com

## Local

    npm install
    cp .env.local.example .env.local
    npm run dev

## Screens

/login          email + password
/today          jobs assigned to you, clock status, queued photo count
/job/[id]       clock in/out, hours today, progress photos, daily update
/job/[id]/qc    the closeout checklist

## How it behaves

- Marking an item **No** expands the row and requires a photo before submit unlocks.
- Photos compress to 1600px / 72% JPEG, land in IndexedDB first, and upload when
  there is signal. Nothing is lost in a basement.
- Submitting fires the database trigger that counts failures, sets pass/fail, and
  moves the job to qc_pending or qc_failed.
- English / Spanish toggle in the top right, stored per device.

## Adding an icon to the home screen

iPhone: Safari -> Share -> Add to Home Screen
Android: Chrome -> menu -> Install app

## Changing the checklist

Checklist items are rows in `checklist_items`, not code. Edit them in the Supabase
table editor. No rebuild, no redeploy.

## Database files, in order

1. campione_schema.sql           tables, triggers, RLS, price book, checklists
2. campione_dashboard_views.sql  dashboard_kpis() + detail views
3. campione_setup_step2.sql      storage policies, signup trigger, makes you owner
4. campione_seed_demo.sql        demo data so every screen has something in it

Remove the demo data later with:  select wipe_demo_data();
