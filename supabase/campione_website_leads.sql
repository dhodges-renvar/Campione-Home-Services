-- ============================================================================
-- CAMPIONE — WEBSITE LEAD INTAKE, STEP 2 OF 2
-- Run campione_website_leads_step1.sql first and let it finish.
-- Then run this file in the Supabase SQL editor. Safe to re-run.
--
-- What this does: the website form posts to one RPC. The database raws-captures
-- the submission (so nothing is ever lost), then creates or reuses the contact,
-- creates the property if an address came through, and files a real lead in the
-- same `leads` table the field app reads. The lead shows up on Jorge's Today
-- page within seconds of someone hitting submit.
-- ============================================================================

-- 1. website as a lead source -------------------------------------------------
insert into lead_sources (code, label, is_paid, sort_order) values
  ('website', 'Website form', false, 12)
on conflict (code) do nothing;

-- 3. raw capture --------------------------------------------------------------
create table if not exists web_submissions (
  id           uuid primary key default uuid_generate_v4(),
  payload      jsonb not null,
  lead_id      uuid references leads(id) on delete set null,
  user_agent   text,
  ip_hash      text,
  page         text,
  error        text,
  created_at   timestamptz not null default now()
);

create index if not exists web_submissions_created_idx on web_submissions (created_at desc);

alter table web_submissions enable row level security;

drop policy if exists web_submissions_office on web_submissions;
create policy web_submissions_office on web_submissions
  for all to authenticated
  using (current_role_is(array['owner','admin','estimator']::app_role[]))
  with check (current_role_is(array['owner','admin','estimator']::app_role[]));

-- 4. slug -> enum -------------------------------------------------------------
create or replace function web_division(p_slug text)
returns division_code
language sql immutable as $$
  select case lower(coalesce(p_slug, 'painting'))
           when 'painting'                then 'painting'
           when 'drywall'                 then 'drywall'
           when 'exteriors'               then 'exteriors'
           when 'exterior'                then 'exteriors'
           when 'pressure-washing'        then 'pressure_washing'
           when 'pressure_washing'        then 'pressure_washing'
           when 'cleaning'                then 'cleaning'
           when 'construction-management' then 'construction'
           when 'construction'            then 'construction'
           else 'painting'
         end::division_code
$$;

-- 5. the intake ---------------------------------------------------------------
create or replace function intake_web_lead(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub      uuid;
  v_contact  uuid;
  v_property uuid;
  v_lead     uuid;
  v_email    text := nullif(btrim(p->>'email'), '');
  v_phone    text := nullif(regexp_replace(coalesce(p->>'phone',''), '[^0-9]', '', 'g'), '');
  v_first    text := nullif(btrim(p->>'first_name'), '');
  v_last     text := nullif(btrim(p->>'last_name'), '');
  v_addr     text := nullif(btrim(p->>'address'), '');
begin
  insert into web_submissions (payload, user_agent, ip_hash, page)
  values (p, p->>'user_agent', p->>'ip_hash', p->>'page')
  returning id into v_sub;

  -- reuse an existing contact before making a new one
  if v_email is not null then
    select id into v_contact from contacts
     where lower(email) = lower(v_email) order by created_at limit 1;
  end if;

  if v_contact is null and v_phone is not null then
    select id into v_contact from contacts
     where regexp_replace(coalesce(phone,''), '[^0-9]', '', 'g') = v_phone
     order by created_at limit 1;
  end if;

  if v_contact is null then
    insert into contacts (first_name, last_name, email, phone, business_type, notes)
    values (
      coalesce(v_first, 'Website'),
      v_last,
      v_email,
      nullif(btrim(p->>'phone'), ''),
      -- only set it if the code actually exists, so the FK can never block intake
      (select bt.code from business_types bt
        where bt.code = coalesce(nullif(p->>'business_type', ''), 'consumer')),
      'Created from website form'
    )
    returning id into v_contact;
  else
    -- fill in blanks without overwriting anything already known
    update contacts set
      first_name = coalesce(first_name, v_first),
      last_name  = coalesce(last_name,  v_last),
      email      = coalesce(email,      v_email),
      phone      = coalesce(phone,      nullif(btrim(p->>'phone'), '')),
      updated_at = now()
    where id = v_contact;
  end if;

  if v_addr is not null then
    insert into properties (address_line1, city, state, postal_code)
    values (v_addr,
            nullif(btrim(p->>'city'), ''),
            coalesce(nullif(btrim(p->>'state'), ''), 'GA'),
            nullif(btrim(p->>'zip'), ''))
    returning id into v_property;
  end if;

  insert into leads (contact_id, property_id, division, source_code, campaign,
                     status, requested_service, raw_message, received_at)
  values (v_contact, v_property,
          web_division(p->>'division'),
          'website',
          nullif(p->>'page', ''),
          'new',
          nullif(btrim(p->>'service'), ''),
          nullif(btrim(p->>'message'), ''),
          now())
  returning id into v_lead;

  update web_submissions set lead_id = v_lead where id = v_sub;
  return v_lead;
end $$;

-- service role only. The website calls this from the server, never the browser.
revoke all on function intake_web_lead(jsonb) from public, anon, authenticated;

-- 6. what came in from the website, newest first ------------------------------
create or replace view v_web_leads with (security_invoker = on) as
select l.id,
       l.received_at,
       l.status,
       l.division,
       l.requested_service,
       l.raw_message,
       l.first_contact_at,
       round(extract(epoch from (l.first_contact_at - l.received_at)) / 60.0, 1)
         as response_minutes,
       c.first_name || ' ' || coalesce(c.last_name, '') as customer,
       c.phone,
       c.email,
       p.address_line1,
       p.city,
       s.page
from leads l
left join contacts c on c.id = l.contact_id
left join properties p on p.id = l.property_id
left join web_submissions s on s.lead_id = l.id
where l.source_code = 'website'
order by l.received_at desc;
