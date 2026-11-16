-- ============================================================================
-- CAMPIONE — SIDING AND EXTERIOR TRIM PRICE BOOK
-- Generated 2026-11-16 from the siding estimator analysis. Safe to re-run.
--
-- This trade does not price like the others, and the difference is deliberate.
--
-- Every other estimator in this app turns a quantity into hours and hours into
-- cost. That is right when Campione's own crew does the work. Siding is subbed
-- to Miguel, so the cost is his invoice, and the two numbers are not close: his
-- board and batten is $1.10/SF, and the hours model put the same work at $2.57.
-- On the 1,680 SF of board and batten in the Tabor takeoff that is a $2,470
-- difference on one line. So sub_rate is the cost basis here, and
-- production_rate rides along as a cross-check and as the basis for the day
-- Campione self-performs.
--
-- The second thing this table carries is status. 14 of these 52 rates came off
-- Miguel's own sheet; the rest were built during the estimator work and nobody
-- has ever quoted them. On the Tabor bid, 63% of the money sat on rates in that
-- second group — which is worth knowing BEFORE the number goes to a builder,
-- not after. The quote screen shows that share and warns above 40%.
--
-- One consequence worth knowing. On the 14 confirmed lines the hours are
-- solved backwards from Miguel's price at our $35.75 loaded rate, because his
-- price is the only hard evidence of how long the work takes — Campione's crew
-- has never hung siding. v_siding_rates.implied_hourly therefore reads about
-- $36 on every confirmed line by construction, and the column earns its keep
-- on the unvalidated ones: anything under $20 or over $60 there is a built rate
-- that does not survive contact with a clock.
--
-- Cornice is the specific trap. Miguel prices a whole eave at $4/LF, $6 with
-- the frieze. Stacking fascia + frieze + soffit + soffit trim + bed molding
-- comes to $12.35/LF for the same eave — $1,906 of invented cost on Tabor
-- alone. The parts are kept in the table because an eave occasionally is a
-- one-off, but they are flagged as cornice parts and the estimator warns when
-- three or more are used without the assembly.
-- ============================================================================

-- 1. the rate book ------------------------------------------------------------
create table if not exists siding_items (
  id              uuid primary key default uuid_generate_v4(),
  code            text unique not null,
  label           text not null,
  unit            text not null,
  sub_rate        numeric(10,4) not null,         -- what Miguel charges. THE cost.
  production_rate numeric(10,3),                  -- units per crew-hour. Cross-check only.
  material_cost   numeric(10,4) not null default 0,
  category        text not null,
  status          text not null default 'unvalidated'
                  check (status in ('confirmed','unvalidated')),
  cornice_part    boolean not null default false, -- folds into the cornice assembly
  active          boolean not null default true,
  sort_order      integer not null default 0,
  notes           text,
  updated_at      timestamptz not null default now()
);

-- 2. the rates ----------------------------------------------------------------
-- material_cost stays 0: on every job so far the builder supplies material.
-- Put a number here only for the lines where Campione buys it.
insert into siding_items
  (code,label,unit,sub_rate,production_rate,category,status,cornice_part,sort_order,notes)
values
 ('demo','Siding demo and haul off','SF',0.85,18.18,'prep','unvalidated',false,110,null),
 ('house_wrap','House wrap','ROLL',150.0,0.238,'prep','confirmed',false,120,'Miguel: $150 per roll. A roll is 9ft x 150ft, so about 1,350 SF before overlap — figure 1,200 SF of wall per roll.'),
 ('starter_strip','Starter strip','LF',0.75,25.0,'prep','unvalidated',false,130,null),
 ('window_flash','Window tape and flashing prep','EA',25.0,1.18,'prep','unvalidated',false,140,'Same number as Miguel''s window trim by coincidence. This is the flashing, not the trim — they are separate operations and both can be on a job.'),
 ('water_table','Water table trim (brick ledge cap)','LF',3.0,9.52,'prep','unvalidated',false,150,null),
 ('lap','Lap siding','SF',0.8,44.688,'field','confirmed',false,210,'Miguel: $80 per square. Hours are an estimate — he has never billed this by the hour.'),
 ('board_batten','Board and batten','SF',1.1,32.5,'field','confirmed',false,220,'Miguel: $110 per square on 4x8 board and better. This is the biggest number in most siding jobs, so it is the one worth being right about.'),
 ('shake_panel','Shake siding — panels','SF',1.2,29.792,'field','confirmed',false,230,'Miguel: $120 per square.'),
 ('shake_individual','Shake siding — individual pieces','SF',1.4,25.536,'field','confirmed',false,240,'Miguel: $140 per square.'),
 ('shake_accent','Hardie shake accent wall','SF',1.5,12.5,'field','unvalidated',false,250,'Overlaps the two shake lines above, which Miguel did quote. Use those unless this is genuinely a small feature wall with its own setup.'),
 ('cornice','Cornice — plain','LF',4.0,8.938,'cornice','confirmed',false,310,'Miguel: $4/LF for the whole eave. One line, not a stack of parts.'),
 ('cornice_frieze','Cornice with frieze (breeze board)','LF',6.0,5.958,'cornice','confirmed',false,320,'Miguel: $6/LF. His "breeze board". This is the usual one on a new house.'),
 ('cornice_assembly','Cornice assembly — frieze, rake, crown','LF',9.5,3.7,'cornice','unvalidated',false,330,'Built rate, $3.50/LF above the $6 Miguel quotes for the same description. Only use it where the eave is genuinely heavier than his standard, and say why in the internal notes.'),
 ('frieze_1x8','1x8 frieze board','LF',4.0,12.5,'cornice','unvalidated',true,340,null),
 ('fascia_composite','1x6 fascia — composite','LF',4.0,11.76,'cornice','unvalidated',true,350,null),
 ('fascia_hardie','1x6 fascia — Hardie trim','LF',4.5,10.0,'cornice','unvalidated',true,360,null),
 ('rake_1x6','Rake board (1x6 at gables)','LF',4.5,10.53,'cornice','unvalidated',true,370,null),
 ('crown_4','4 inch crown molding','LF',5.0,8.0,'cornice','unvalidated',true,380,null),
 ('bed_molding','Bed molding','LF',2.5,18.18,'cornice','unvalidated',true,390,null),
 ('soffit_hardie','Soffit — Hardie','LF',3.0,9.52,'soffit','unvalidated',true,410,null),
 ('soffit_composite','Soffit — composite','LF',2.5,10.53,'soffit','unvalidated',true,420,null),
 ('soffit_vented','Soffit — vented aluminum or vinyl','LF',3.0,22.22,'soffit','unvalidated',true,430,null),
 ('soffit_trim','Soffit trim (1x4)','LF',0.85,22.22,'soffit','unvalidated',true,440,null),
 ('band_1x10','1x10 band board','LF',4.0,8.938,'trim','confirmed',false,510,'Miguel: $4/LF.'),
 ('band_drip','Band board with drip cap','LF',4.0,8.7,'trim','unvalidated',false,520,null),
 ('window_trim_ea','Window trim — per window','EA',25.0,1.43,'trim','confirmed',false,530,'Miguel: $25 a window, however many sides. Count windows, not feet — this is how the invoice comes in.'),
 ('window_trim_lf','Window trim 1x4 — by the foot','LF',2.0,15.38,'trim','unvalidated',false,540,'Here only for an odd opening Miguel prices separately. A normal window goes on the per-window line.'),
 ('window_header','Header trim over window','LF',3.5,11.11,'trim','unvalidated',false,550,null),
 ('door_trim','Exterior door trim','LF',2.5,15.38,'trim','unvalidated',false,560,null),
 ('corner_single','Corner board — single','LF',2.75,16.67,'trim','unvalidated',false,570,null),
 ('corner_double','Corner board — double','LF',4.0,9.52,'trim','unvalidated',false,580,null),
 ('vert_trim_1x4','1x4 vertical trim (field or returns)','LF',2.5,15.38,'trim','unvalidated',false,590,null),
 ('gable_trim','Decorative gable trim','LF',5.0,9.09,'trim','unvalidated',false,600,null),
 ('pediment','Decorative pediment header','LF',4.0,null,'trim','unvalidated',false,610,null),
 ('skirt_board','Skirt board','LF',1.0,18.18,'trim','unvalidated',false,620,null),
 ('column_wrap','Decorative column wrap with trim kit','EA',200.0,0.2,'porch','unvalidated',false,710,'The single largest unvalidated rate in the book, and 17 of them carried $3,400 on the Tabor bid. Worth a price from Miguel before the next one goes out.'),
 ('beam_wrap','Porch beam wrap','LF',4.25,6.67,'porch','unvalidated',false,720,null),
 ('post_kit','Post — pre-wrapped kit','EA',150.0,0.33,'porch','unvalidated',false,730,null),
 ('post_wrap_site','Post — set and wrap on site','EA',175.0,0.17,'porch','unvalidated',false,740,null),
 ('post_set','Post — set new 4x4 or 6x6 only','EA',125.0,0.29,'porch','unvalidated',false,750,null),
 ('post_reset','Post — reset existing and wrap','EA',125.0,0.28,'porch','unvalidated',false,760,null),
 ('corbel','Basic corbel support','EA',40.0,1.54,'porch','unvalidated',false,770,null),
 ('corner_return','Decorative corner return','EA',40.0,1.18,'porch','unvalidated',false,780,null),
 ('ceiling_ply','Ceiling — 4x8 plywood','SF',3.0,11.917,'ceiling','confirmed',false,810,'Miguel: $3/SF.'),
 ('ceiling_hardie_porch','Ceiling — front porch, Hardie panel','SF',2.5,16.67,'ceiling','unvalidated',false,820,'Below the plywood Miguel quotes at $3.00, which is the cheaper material. Ask him.'),
 ('ceiling_hardie_deck','Ceiling — covered deck, Hardie panel','SF',2.75,15.38,'ceiling','unvalidated',false,830,null),
 ('tg_1x6','Ceiling — 1x6 tongue and groove','SF',6.0,5.958,'ceiling','confirmed',false,840,'Miguel: $6/SF. The estimator had this at $3.25 — under half. Any quote built before November 2026 with a T&G porch ceiling in it is light.'),
 ('tg_1x4','Ceiling — 1x4 tongue and groove','SF',8.0,4.469,'ceiling','confirmed',false,850,'Miguel: $8/SF. Narrower boards, more courses, more cuts.'),
 ('fireplace_regular','Fireplace chase — regular','EA',600.0,0.06,'specialty','confirmed',false,910,'Miguel: $600. Note it is MORE than the one that runs up the roof — ask him which way round he meant before you lean on it.'),
 ('fireplace_roof','Fireplace chase — up the roof','EA',400.0,0.089,'specialty','confirmed',false,920,'Miguel: $400. The estimator carried $80 for a chase, which is not in the same world.'),
 ('shutters','Shutters (pair)','EA',50.0,1.67,'specialty','unvalidated',false,930,null),
 ('gable_vent','Louvered gable vent','EA',75.0,0.5,'specialty','unvalidated',false,940,null)
on conflict (code) do update set
  label           = excluded.label,
  unit            = excluded.unit,
  sub_rate        = excluded.sub_rate,
  production_rate = excluded.production_rate,
  category        = excluded.category,
  status          = excluded.status,
  cornice_part    = excluded.cornice_part,
  sort_order      = excluded.sort_order,
  notes           = excluded.notes,
  updated_at      = now();

-- 3. margins ------------------------------------------------------------------
-- Jorge's own bands: 30% to production builders, 35-40% custom, 45-50%
-- residential. One rate card, margin as the only variable — which was the point
-- of the exercise.
--
-- The minimums are placeholders and Jorge should set them. A siding crew that
-- mobilizes costs a day whether the job is a gable or a whole house.
insert into trade_margins (trade, business_type, target_margin, minimum_charge, notes) values
 ('siding','consumer',          0.48,1200,'Homeowner, direct. 45-50 band, middle of it.'),
 ('siding','realtor',           0.42, 900,'Pre-list repairs. Fast decisions, small scopes.'),
 ('siding','property_mgmt',     0.35, 900,'Portfolio work. Repeat volume buys the rate down.'),
 ('siding','small_builder',     0.38, 750,'Custom builder. Jorge''s 35-40 band.'),
 ('siding','production_builder',0.30,   0,'Volume. No minimum — the tickets come in a run.')
on conflict (trade, business_type) do update set
  target_margin  = excluded.target_margin,
  minimum_charge = excluded.minimum_charge;

-- 4. proposal language --------------------------------------------------------
insert into proposal_defaults (trade, section, body) values
 ('siding','scope',
  'Furnish labor to install siding and exterior trim as measured and listed in this '
  'proposal. Work includes cutting, fastening, caulking at trim joints and butt joints, '
  'and daily cleanup of the work area. Material is supplied by others unless a line in '
  'this proposal states otherwise.'),
 ('siding','exclusions',
  'Not included: painting or staining of any kind; rotten or damaged framing, sheathing '
  'or substrate discovered behind existing siding; gutter removal and reinstallation; '
  'electrical fixture or meter detachment; window or door replacement; permits; '
  'structural repair; scaffolding beyond standard ladder and pump-jack access. Concealed '
  'damage is quoted as a change order once it is open and visible.'),
 ('siding','customer',
  'Material on site and staged before the crew mobilizes, or the day is lost and '
  'rebilled. Clear access to all elevations, including vehicles moved and gates '
  'unlocked. Power available within 100 feet. Landscaping and irrigation heads flagged '
  'where they sit tight to the wall.'),
 ('siding','internal',
  'Check the unvalidated share on the breakdown before this goes out. Over 40% of the '
  'cost sitting on rates Miguel has never quoted means call him first. Cornice goes on '
  'ONE line at $4 or $6 — if the quote has fascia, frieze and soffit stacked separately, '
  'that eave is priced twice.')
on conflict (trade, section) do update set body = excluded.body;

-- 5. RLS ----------------------------------------------------------------------
-- Read is open to any signed-in user: it is a rate book, and the quote screen
-- needs it on every device.
--
-- Write is office-level, and the role names are read out of the app_role enum
-- rather than written in by hand. The hand-written version is what broke:
-- 'office' is not a value in that enum, and naming a value an enum does not have
-- is an error at CREATE POLICY time, not a condition that quietly never matches.
-- Intersecting with the enum's real labels means this runs whatever the enum
-- holds, and the NOTICE at the end says which roles it ended up covering.
do $$
declare
  want text[] := array['owner','admin','office','manager','admin_office','staff','ops'];
  have text[];
  list text;
begin
  execute 'alter table siding_items enable row level security';
  execute 'drop policy if exists ref_read on siding_items';
  execute 'create policy ref_read on siding_items for select to authenticated using (true)';

  if exists (select 1 from pg_type where typname = 'app_role') then
    select array_agg(e.enumlabel::text order by e.enumsortorder) into have
      from pg_enum e join pg_type t on t.oid = e.enumtypid
     where t.typname = 'app_role' and e.enumlabel::text = any(want);
  else
    have := want;            -- plain text column: any literal compares safely
  end if;

  execute 'drop policy if exists office_all on siding_items';
  if have is null or array_length(have, 1) = 0 then
    raise notice 'siding_items: none of the expected office roles exist in app_role, '
                 'so NO write policy was created. Read works; the setup screen will '
                 'not be able to save rates until a policy naming your real roles is added.';
  else
    select string_agg(quote_literal(r), ',') into list from unnest(have) r;
    execute format($f$create policy office_all on siding_items for all to authenticated
      using (exists (select 1 from app_users u where u.id = auth.uid()
                     and u.role::text in (%s)))
      with check (exists (select 1 from app_users u where u.id = auth.uid()
                     and u.role::text in (%s)))$f$, list, list);
    raise notice 'siding_items write policy covers: %', array_to_string(have, ', ');
  end if;
end $$;

-- 6. what the setup screen reads ----------------------------------------------
create or replace view v_siding_rates with (security_invoker = on) as
select code, label, category, unit, sub_rate, production_rate, status, cornice_part,
       sort_order, notes,
       case when production_rate is null then null
            else round(sub_rate * production_rate, 2) end as implied_hourly
  from siding_items where active
 order by sort_order;
-- implied_hourly is the useful column: sub_rate x production_rate is what Miguel
-- is effectively earning per hour on that line. Where it comes out near $35 the
-- two bases agree. Where it comes out at $80 the production rate is wrong, not
-- his price.

-- ──────────────────────────────────────────────────────────── check it
-- select category, status, count(*), round(avg(implied_hourly)) as avg_hourly
--   from v_siding_rates group by 1,2 order by 1,2;
-- select * from v_siding_rates where status = 'confirmed' order by sort_order;
