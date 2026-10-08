-- ============================================================================
-- CAMPIONE — CLEANING DIVISION PRICE BOOK
-- Run AFTER campione_exterior.sql. Safe to re-run.
--
-- Every other trade in this app prices from production rates, so cleaning does
-- too: square footage divided by a rate gives hours, hours carry the labour and
-- the supplies, and margin turns cost into price.
--
-- One rule that keeps this honest: a type's production rate covers the STANDARD
-- CHECKLIST for that type and nothing more. Everything that is genuinely extra
-- — appliance interiors, cabinet interiors, overspray, a second dust pass — is
-- its own line. Bury those in the base rate and you cannot see what you are
-- selling, and you charge for them twice the moment someone adds them back. That keeps one mental model
-- across the whole app and it means a rate change on this table moves every
-- future quote.
--
-- Window cleaning is the exception. Jorge already has a published price list by
-- window size, so that list is stored as-is and billed at its own rate rather
-- than flowed through the job margin.
-- ============================================================================

-- 1. types of clean -----------------------------------------------------------
create table if not exists cleaning_types (
  id              uuid primary key default uuid_generate_v4(),
  code            text unique not null,
  label           text not null,
  production_rate numeric(10,3) not null,       -- SF per cleaner-hour
  min_charge      numeric(10,2) not null default 0,
  is_recurring    boolean not null default false,
  is_commercial   boolean not null default false,
  default_condition text not null default 'normal',
  active          boolean not null default true,
  sort_order      int not null default 0,
  notes           text,
  updated_at      timestamptz not null default now()
);
drop trigger if exists trg_ct_updated on cleaning_types;
create trigger trg_ct_updated before update on cleaning_types
  for each row execute function set_updated_at();

insert into cleaning_types (code,label,production_rate,min_charge,is_recurring,is_commercial,default_condition,sort_order,notes) values
 ('post_final',   'Post-construction final',      220, 350,false,false,'normal', 1,'Rate covers a thorough final on a standard checklist. The construction burden — overspray, the second dust pass, sticker removal — is added by line so you can see it and the customer can too.'),
 ('post_rough',   'Post-construction rough',      400, 250,false,false,'normal', 2,'Mid-construction. Debris out, surfaces knocked down, no detail.'),
 ('touch_up',     'Touch-up before walkthrough',  500, 200,false,false,'light',  3,'After the punch list. Assumes a final was already done.'),
 ('move_out',     'Move-in / move-out, empty',    260, 275,false,false,'heavy',  4,'Empty-house checklist. Appliance and cabinet interiors are add-on lines, not in this rate — they are the first thing an inspection catches and the first thing people forget to price.'),
 ('turn',         'Rental turn / make-ready',     300, 225,false,false,'heavy',  5,'Portfolio work on a standing checklist. Photograph it.'),
 ('deep',         'Deep clean, occupied',         260, 250,false,false,'heavy',  6,'One-off. Working around furniture and people.'),
 ('recurring',    'Recurring residential',        550, 110,true, false,'normal', 7,'Weekly, biweekly or monthly. The house stays cleaner, so the per-visit rate drops with frequency.'),
 ('comm_final',   'Commercial post-construction', 350, 500,false,true, 'normal', 8,'Open floor plates clean faster than houses. Less detail, more area.'),
 ('comm_recur',   'Commercial recurring',         850, 150,true, true, 'normal', 9,'Storefronts, offices, common areas on a schedule.')
on conflict (code) do update set
  production_rate = excluded.production_rate,
  min_charge      = excluded.min_charge,
  notes           = excluded.notes;

-- 2. add-ons — the things an average SF rate does not cover --------------------
create table if not exists cleaning_addons (
  id            uuid primary key default uuid_generate_v4(),
  code          text unique not null,
  label         text not null,
  unit          text not null,                 -- EA | SF | LF
  hours_each    numeric(10,4) not null,        -- cleaner-hours per unit
  material_cost numeric(10,2) not null default 0,
  category      text not null,                 -- kitchen | detail | construction | exterior | other
  active        boolean not null default true,
  sort_order    int not null default 0,
  notes         text,
  updated_at    timestamptz not null default now()
);
drop trigger if exists trg_ca_updated on cleaning_addons;
create trigger trg_ca_updated before update on cleaning_addons
  for each row execute function set_updated_at();

insert into cleaning_addons (code,label,unit,hours_each,material_cost,category,sort_order,notes) values
 -- kitchen
 ('fridge_int',    'Refrigerator interior',            'EA',0.75,0,'kitchen',     1,''),
 ('oven_int',      'Oven interior',                    'EA',1.00,4,'kitchen',     2,'Degreaser and dwell time. Budget the hour.'),
 ('cabinet_int',   'Cabinet and drawer interiors',     'EA',2.00,0,'kitchen',     3,'Per kitchen. Always asked for on a move-out, rarely in the base rate.'),
 ('appliance_ext', 'Appliance exteriors and under',    'EA',0.30,0,'kitchen',     4,''),
 -- detail
 ('blinds',        'Blinds, per window',               'EA',0.25,0,'detail',     10,''),
 ('ceiling_fans',  'Ceiling fans',                     'EA',0.20,0,'detail',     11,''),
 ('light_fix',     'Light fixtures and lenses',        'EA',0.15,0,'detail',     12,'Lenses come down, get washed, go back. Slower than it sounds.'),
 ('vents',         'Vents and registers',              'EA',0.08,0,'detail',     13,''),
 ('tracks_sills',  'Window tracks and sills',          'EA',0.10,0,'detail',     14,'Not the glass — glass is priced on the window list.'),
 ('baseboard',     'Baseboard hand detail',            'LF',0.0060,0,'detail',   15,'About 165 LF an hour. On a final this is where the dust actually lives.'),
 ('grout',         'Tile and grout detail',            'SF',0.0200,0.06,'detail',16,''),
 ('wall_spot',     'Spot wall washing',                'SF',0.0040,0,'detail',   17,''),
 -- post-construction specific
 ('stickers',      'Label and sticker removal',        'EA',0.10,0,'construction',20,'Every window, every appliance, every fixture.'),
 ('overspray',     'Overspray and paint fleck removal','SF',0.0120,0,'construction',21,'Blade work on glass and hard surfaces. The single most underestimated line on a post-construction clean.'),
 ('dust_second',   'Second dust pass',                 'SF',0.0035,0,'construction',22,'Drywall dust settles again after the first pass. Plan for it or come back for free.'),
 ('debris',        'Construction debris haul-off',     'EA',1.50,45,'construction',23,'Volume debris is a dumpster, not a clean. This is the leftovers.'),
 -- exterior
 ('garage',        'Garage sweep and blow out',        'EA',0.50,0,'exterior',   30,''),
 ('patio_wash',    'Pressure wash patio or walkway',   'SF',0.0040,0,'exterior', 31,''),
 ('porch_detail',  'Porch, rails and entry detail',    'EA',0.75,0,'exterior',   32,'')
on conflict (code) do update set
  hours_each = excluded.hours_each,
  label      = excluded.label,
  notes      = excluded.notes;

-- 3. window cleaning — Jorge's published list, stored as given -----------------
create table if not exists window_clean_rates (
  id          uuid primary key default uuid_generate_v4(),
  code        text unique not null,
  label       text not null,
  is_high     boolean not null default false,
  labor_each  numeric(10,2) not null,
  bill_each   numeric(10,2) not null,
  active      boolean not null default true,
  sort_order  int not null default 0,
  notes       text,
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_wcr_updated on window_clean_rates;
create trigger trg_wcr_updated before update on window_clean_rates
  for each row execute function set_updated_at();

insert into window_clean_rates (code,label,is_high,labor_each,bill_each,sort_order,notes) values
 ('small',        'Small',             false, 9.00,15.00,1,''),
 ('small_high',   'Small (high)',      true, 12.00,20.00,2,'Ladder or pole.'),
 ('standard',     'Standard',          false,15.00,25.00,3,''),
 ('standard_high','Standard (high)',   true, 18.00,30.00,4,''),
 ('large',        'Large',             false,24.00,40.00,5,''),
 ('large_high',   'Large (high)',      true, 30.00,50.00,6,'Corrected from the source sheet, which had $10,550 in this cell. Every other line holds a clean 40 percent, so this is 30 / 0.60.'),
 ('grid',         'Divided-lite / grid adder', false, 4.00, 7.50,7,'Source sheet says $3-$5 labour and +$5 to $10 billed. Midpoints used.')
on conflict (code) do update set
  labor_each = excluded.labor_each,
  bill_each  = excluded.bill_each,
  notes      = excluded.notes;

-- 4. modifiers ----------------------------------------------------------------
insert into modifiers (group_code, option_code, label, multiplier, sort_order) values
 ('clean_condition','light',     'Light — already maintained',        0.85,1),
 ('clean_condition','normal',    'Normal',                            1.00,2),
 ('clean_condition','heavy',     'Heavy — neglected or move-out',     1.20,3),
 ('clean_condition','post_heavy','Unusually dirty site',              1.30,4),
 ('clean_stories','one',   'One storey',   1.00,1),
 ('clean_stories','two',   'Two storeys',  1.08,2),
 ('clean_stories','three', 'Three or more',1.15,3),
 ('clean_occupied','empty',   'Empty',    1.00,1),
 ('clean_occupied','occupied','Occupied', 1.12,2),
 ('clean_frequency','one_time','One time',       1.00,1),
 ('clean_frequency','monthly', 'Monthly',        0.95,2),
 ('clean_frequency','biweekly','Every two weeks',0.88,3),
 ('clean_frequency','weekly',  'Weekly',         0.80,4)
on conflict (group_code, option_code) do update set
  label = excluded.label, multiplier = excluded.multiplier;

-- 5. settings -----------------------------------------------------------------
insert into business_settings (key, value, label, notes) values
 ('clean_labor_rate',       '26',  'Cleaner — burdened hourly', 'Wage plus burden. Lower than a painter, which is why cleaning carries margin at a lower price point.'),
 ('clean_supplies_per_hour','2.25','Cleaning supplies per hour','Chemicals, pads, bags, filters.'),
 ('clean_trip_charge',      '0',   'Cleaning trip charge',      'Set above zero for jobs outside the normal ring.'),
 ('clean_crew_size',        '2',   'Default cleaning crew size','Only used to turn hours into crew-days on the quote screen.')
on conflict (key) do nothing;

-- 6. margins ------------------------------------------------------------------
insert into trade_margins (trade, business_type, target_margin, minimum_charge, notes) values
 ('cleaning','consumer',          0.45,250,'Matches the 40 percent on the window sheet once supplies are in.'),
 ('cleaning','realtor',           0.42,200,'Turnover work. Fast and repeat.'),
 ('cleaning','property_mgmt',     0.40,175,'Standing scope across a portfolio. Lowest per-unit, best predictability.'),
 ('cleaning','small_builder',     0.40,250,'Final cleans behind a custom builder.'),
 ('cleaning','production_builder',0.30,  0,'Volume. No minimum — unit tickets are small.')
on conflict (trade, business_type) do update set
  target_margin = excluded.target_margin,
  minimum_charge = excluded.minimum_charge;

-- 7. RLS ----------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['cleaning_types','cleaning_addons','window_clean_rates'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists ref_read on %I', t);
    execute format('create policy ref_read on %I for select to authenticated using (true)', t);
    execute format('drop policy if exists office_all on %I', t);
    execute format($f$create policy office_all on %I for all to authenticated
      using (exists (select 1 from app_users u where u.id = auth.uid()
                     and u.role in ('owner','admin','office')))
      with check (exists (select 1 from app_users u where u.id = auth.uid()
                     and u.role in ('owner','admin','office')))$f$, t);
  end loop;
end $$;

-- 8. what the setup screen reads ----------------------------------------------
create or replace view v_cleaning_rates with (security_invoker = on) as
select 'type'  as kind, code, label, production_rate as value, 'SF/hr' as unit, sort_order, notes
  from cleaning_types where active
union all
select 'addon', code, label, hours_each, 'hr/'||unit, sort_order + 100, notes
  from cleaning_addons where active
union all
select 'window', code, label, bill_each, '$ billed', sort_order + 200, notes
  from window_clean_rates where active
order by sort_order;

-- 9. proposal language ---------------------------------------------------------
insert into proposal_defaults (trade, section, body) values
 ('cleaning','scope',
  'Campione Home Services will perform the cleaning scope described in this proposal, working top-down so that ceilings, fans and the tops of cabinets are done before floors. All labour, equipment, HEPA vacuums and supplies are included. A written room-by-room checklist is provided before work begins, and the work is photographed on completion.'),
 ('cleaning','exclusions',
  'Not included: construction debris in volume (that is a dumpster, not a clean); mould remediation and biohazard cleanup; carpet and upholstery extraction; exterior window cleaning above the second storey; moving of furniture, appliances or stored items; repair of any surface already damaged before we arrived. Exterior pressure washing, appliance interiors, cabinet interiors and window cleaning are included only where they appear as priced line items above.'),
 ('cleaning','customer',
  'Please have power and running water available, all personal items and valuables removed from the areas to be cleaned, and other trades finished and off site. On a post-construction final, the punch list should be complete — we cannot clean behind a trade that has not finished. If the space is not ready when the crew arrives, a return trip is billed at the minimum charge.'),
 ('cleaning','internal',
  'Confirm before sending: square footage is finished area only; condition matches what the rep actually saw; overspray, second dust pass and sticker removal are all on for a post-construction final; window count is glass units, not openings. Check the blended margin on the breakdown — glass bills off the published list, so a job that is mostly windows will read differently from one that is mostly floor area.')
on conflict (trade, section) do nothing;
