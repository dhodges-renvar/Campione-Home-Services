-- ============================================================================
-- CAMPIONE — WEBSITE LEAD INTAKE, STEP 1 OF 2
--
-- Run this file BY ITSELF and let it finish before running
-- campione_website_leads.sql.
--
-- Why it is separate: Postgres will not let a new enum value be added and then
-- used inside the same transaction. The drywall division was never added to
-- division_code, and the intake function needs it, so the value has to be
-- committed first. Two clicks instead of one.
--
-- Safe to re-run. If it says the value already exists, you are already done.
-- ============================================================================

alter type division_code add value if not exists 'drywall';
