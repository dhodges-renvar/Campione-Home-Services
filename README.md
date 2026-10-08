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

---

## Cleaning division — added October 2026

**Run `supabase/campione_cleaning.sql` once, after `campione_exterior.sql`.** It is
safe to re-run. Then Cleaning goes live under Quote → Cleaning.

### How it prices

Same model as every other trade here: square footage over a production rate gives
hours, hours carry labour and supplies, margin turns cost into price. One rule
keeps it honest — **a type's production rate covers the standard checklist for
that type and nothing more.** Appliance interiors, cabinet interiors, overspray
and a second dust pass are their own lines, so you can see what you are selling
and you never charge for the same work twice.

Glass is the exception. Jorge's published window list bills at its own rate
rather than flowing through the job margin, which keeps that sheet intact and
shows the glass margin separately on the breakdown.

### What you change, and where

| Thing | Where |
| --- | --- |
| Type of clean, SF per hour, minimum | `cleaning_types` |
| Add-on hours per unit | `cleaning_addons` |
| Window prices by size | `window_clean_rates` |
| Condition, storeys, furniture, frequency | `modifiers`, group codes `clean_*` |
| Cleaner rate, supplies, trip charge, crew size | `business_settings`, keys `clean_*` |
| Margin and minimum by customer type | `trade_margins`, trade `cleaning` |
| Proposal language | `proposal_defaults`, trade `cleaning` |

### One correction carried in

Jorge's sheet bills **Large (high)** at `$10,550.00`. Every other line on it holds
a clean 40% — labour divided by 0.60 — so the table here stores `$50.00`. Fix it
at the source too, or the next person to use that sheet on a two-storey great
room will send an absurd quote.

### Still missing

The **Final Cleaning** rates never came through — the message ended at the
heading. Everything above the window list is built from production rates and
calibrated against market ($0.57/SF on a post-construction final, $0.44 on a
move-out, $230 a visit on a 2,500 SF biweekly). Replace them in `cleaning_types`
the moment Jorge's real numbers arrive.
