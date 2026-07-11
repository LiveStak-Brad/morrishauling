-- Divisions foundation: Junk Removal + Hauling under Morris Services
-- Extends existing service_type without breaking single-tenant company model.

create table if not exists public.divisions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  short_name text not null,
  service_type text not null check (service_type in ('junk_removal', 'hauling_transport')),
  launch_status text not null default 'accepting_interest'
    check (launch_status in (
      'setup',
      'internal_testing',
      'accepting_interest',
      'accepting_estimate_requests',
      'accepting_bookings',
      'temporarily_paused'
    )),
  logo_path text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists divisions_company_id_idx on public.divisions(company_id);

insert into public.divisions (id, company_id, name, short_name, service_type, launch_status, logo_path)
values
  ('junk_removal', 'morris-hauling', 'Morris Junk Removal', 'Junk Removal', 'junk_removal', 'accepting_interest', '/logo.png'),
  ('hauling', 'morris-hauling', 'Morris Hauling', 'Hauling', 'hauling_transport', 'accepting_interest', '/haulinglogo.png')
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  service_type = excluded.service_type,
  logo_path = excluded.logo_path,
  updated_at = now();

alter table public.jobs add column if not exists division_id text references public.divisions(id);
alter table public.estimates add column if not exists division_id text references public.divisions(id);
alter table public.invoices add column if not exists division_id text references public.divisions(id);
alter table public.schedule_slots add column if not exists division_id text references public.divisions(id);
alter table public.employees add column if not exists primary_division_id text references public.divisions(id);
alter table public.profiles add column if not exists division_access text not null default 'all';
alter table public.profiles add column if not exists managed_division_ids text[] not null default '{}';

-- Backfill jobs from service_type
update public.jobs
set division_id = case
  when service_type = 'hauling_transport' then 'hauling'
  else 'junk_removal'
end
where division_id is null;

update public.estimates e
set division_id = coalesce(
  (select j.division_id from public.jobs j where j.id = e.job_id),
  case when e.estimate_type = 'hauling_transport' then 'hauling' else 'junk_removal' end
)
where e.division_id is null;

update public.invoices i
set division_id = coalesce(
  (select j.division_id from public.jobs j where j.id = i.job_id),
  'junk_removal'
)
where i.division_id is null;

update public.schedule_slots
set division_id = 'junk_removal'
where division_id is null;

create index if not exists jobs_division_id_idx on public.jobs(company_id, division_id);
create index if not exists estimates_division_id_idx on public.estimates(company_id, division_id);
create index if not exists invoices_division_id_idx on public.invoices(company_id, division_id);
create index if not exists schedule_slots_division_id_idx on public.schedule_slots(company_id, division_id);

-- Material categories (accepted / restricted / prohibited)
create table if not exists public.material_categories (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  division_id text not null references public.divisions(id) on delete cascade,
  name text not null,
  policy text not null check (policy in ('accepted', 'restricted', 'prohibited')),
  notes text,
  disposal_hint text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_categories_division_idx
  on public.material_categories(company_id, division_id, active);

insert into public.material_categories (id, company_id, division_id, name, policy, notes, disposal_hint, sort_order)
values
  ('mat-general', 'morris-hauling', 'junk_removal', 'General household junk', 'accepted', null, 'Municipal / transfer station', 10),
  ('mat-furniture', 'morris-hauling', 'junk_removal', 'Furniture', 'accepted', null, 'Transfer station or donation', 20),
  ('mat-appliances', 'morris-hauling', 'junk_removal', 'Appliances', 'accepted', 'Freon units may require certified recovery', 'Appliance / scrap yard', 30),
  ('mat-electronics', 'morris-hauling', 'junk_removal', 'Electronics', 'restricted', 'E-waste rules vary by county', 'E-waste recycler', 40),
  ('mat-metal', 'morris-hauling', 'junk_removal', 'Metal', 'accepted', null, 'Scrap yard', 50),
  ('mat-yard', 'morris-hauling', 'junk_removal', 'Yard waste', 'accepted', null, 'Yard waste facility', 60),
  ('mat-construction', 'morris-hauling', 'junk_removal', 'Construction debris', 'accepted', null, 'C&D landfill', 70),
  ('mat-mattress', 'morris-hauling', 'junk_removal', 'Mattresses', 'accepted', 'May incur surcharge', 'Transfer station', 80),
  ('mat-tires', 'morris-hauling', 'junk_removal', 'Tires', 'restricted', 'Quantity limits and fees apply', 'Tire recycler', 90),
  ('mat-paint', 'morris-hauling', 'junk_removal', 'Paint or chemicals', 'prohibited', 'Household hazardous waste — not accepted on standard loads', 'County HHW event', 100),
  ('mat-refrigerant', 'morris-hauling', 'junk_removal', 'Refrigerators and air conditioners', 'restricted', 'Requires refrigerant recovery', 'Certified appliance recycler', 110),
  ('mat-shingles', 'morris-hauling', 'junk_removal', 'Shingles', 'restricted', 'Weight and disposal fees apply', 'C&D landfill', 120)
on conflict (id) do nothing;

-- Job photo stage tracking
alter table public.job_photos add column if not exists photo_stage text;
alter table public.job_photos add column if not exists required_for_completion boolean not null default false;

-- Completion override audit
alter table public.jobs add column if not exists completion_override_reason text;
alter table public.jobs add column if not exists completion_override_by text;
alter table public.jobs add column if not exists completion_override_at timestamptz;

-- Hauling capacity / safety config on divisions.config (documented keys):
-- max_route_miles, max_weight_lbs, require_review_interstate, trailer_capacity_rules

-- Notification outbox for customer/staff events
create table if not exists public.notification_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public.companies(id) on delete cascade,
  division_id text references public.divisions(id),
  job_id text references public.jobs(id) on delete set null,
  customer_id text,
  profile_id text,
  event_type text not null,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms')),
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notification_events_company_idx on public.notification_events(company_id, created_at desc);
create index if not exists notification_events_job_idx on public.notification_events(job_id);
create index if not exists notification_events_status_idx on public.notification_events(status) where status = 'pending';
