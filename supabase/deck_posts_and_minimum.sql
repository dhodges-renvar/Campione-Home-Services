-- Campione Field — deck estimator follow-ups from Jorge's 12x24 quote, Nov 2026.
--
--   1. A day minimum held in HOURS, so it survives a labour-rate change.
--   2. Posts and the under-deck lines gathered into one findable category,
--      and posts banded by height.
--
-- Jorge's note was that he saw no option for support posts. The row existed —
-- code 'posts', filed under the RAIL category at sort 23, behind the spindles.
-- Nothing was missing; it was just somewhere nobody would look. Same story for
-- floor_under (under Floor) and beams / lattice (under Covered / structure).
--
-- Safe to run more than once. Uses "where not exists" rather than "on conflict"
-- so it does not depend on a unique index being present on code.

-- ─────────────────────────────────────────────── 1. the day minimum
-- One crew-day. The estimator floors BILLED hours at this, then margin applies
-- on top, so a small deck still pays for the day the crew spends on it.
-- trade_margins.minimum_charge stays as it is — that is a separate price floor,
-- and flooring the price alone covers the revenue without covering the cost.
insert into business_settings (key, value, label, notes)
select 'minimum_crew_hours', 8, 'Minimum crew hours per job',
       'Floor on billed crew hours. 8 = one crew-day. Held in hours, not dollars, '
       'so it stays correct when the labour rate changes.'
where not exists (select 1 from business_settings where key = 'minimum_crew_hours');

-- ──────────────────────────── 2a. the existing posts row becomes the mid band
-- Kept as code 'posts' on purpose: saved estimates carry that code in their
-- settings JSON, and retiring it would silently drop the line from old quotes.
-- The rate stays at 2.200/hr, so a normal deck prices exactly as it does today.
update deck_surfaces
   set label = 'Support post — 4 to 8 ft',
       category = 'substructure',
       sort_order = 420,
       notes = 'Standard raised deck. Step stool, not a ladder. '
               'The original Posts line — rate unchanged.'
 where code = 'posts';

-- ──────────────────────────────────── 2b. the two bands either side of it
-- Calibrated off his own 2.200/hr rather than invented: a short post is quicker
-- to get round, a tall one needs a ladder and someone steadying it. Coverage
-- scales the same way, since it is surface per post that drinks the stain.
insert into deck_surfaces
  (code, label, unit, production_rate, coverage, category,
   default_coats, material_cost, active, sort_order, notes)
select v.code, v.label, v.unit, v.production_rate, v.coverage, v.category,
       v.default_coats, v.material_cost, v.active, v.sort_order, v.notes
from (values
  ('posts_low',  'Support post — under 4 ft', 'EA', 3.5::numeric, 24::numeric,
   'substructure', 2::integer, 0::numeric, true, 410::integer,
   'Low deck. Four faces plus the cap, no ladder.'),
  ('posts_tall', 'Support post — over 8 ft',  'EA', 1.4,          8,
   'substructure', 2, 0, true, 430,
   'Ladder work and a second person steadying. Usually 6x6. '
   'Slower per post than a covered-porch column.')
) as v (code, label, unit, production_rate, coverage, category,
        default_coats, material_cost, active, sort_order, notes)
where not exists (select 1 from deck_surfaces d where d.code = v.code);

-- ───────────────── 2c. the rest of the under-deck work, gathered in one place
-- These rows already exist and their rates are untouched. Only the category and
-- the running order change, so that everything under a deck sits together
-- instead of being spread across Floor, Rail and Covered / structure.
update deck_surfaces set category = 'substructure', sort_order = 440 where code = 'beams';
update deck_surfaces set category = 'substructure', sort_order = 450 where code = 'floor_under';
update deck_surfaces set category = 'substructure', sort_order = 460 where code = 'lattice';

-- What stays in 'structure' after this: fascia, columns, porch_ceiling,
-- half_wall — which reads as covered-porch work, and is coherent on its own.

-- ──────────────────────────────────────────────────────── check it
-- select key, value, label from business_settings where key = 'minimum_crew_hours';
-- select code, label, unit, production_rate, coverage, category, sort_order
--   from deck_surfaces where category in ('substructure','structure')
--   order by category, sort_order;
