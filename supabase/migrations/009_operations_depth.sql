-- Operational depth: timeclock, maintenance, dump closures, callbacks, interactions

-- ---------------------------------------------------------------------------
-- Employee timeclock
-- ---------------------------------------------------------------------------
create table if not exists public.employee_timeclock (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  profile_id text references public.profiles(id) on delete set null,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  shift_date date not null,
  shift_status text not null default 'clocked_in'
    check (shift_status in ('clocked_in', 'clocked_out', 'on_break', 'no_show')),
  start_location jsonb,
  end_location jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_timeclock_company_date_idx
  on public.employee_timeclock (company_id, shift_date desc);

create index if not exists employee_timeclock_employee_idx
  on public.employee_timeclock (company_id, employee_id, shift_date desc);

-- ---------------------------------------------------------------------------
-- Truck maintenance fields
-- ---------------------------------------------------------------------------
alter table public.trucks add column if not exists odometer_miles int;
alter table public.trucks add column if not exists last_service_at date;
alter table public.trucks add column if not exists next_service_due_at date;
alter table public.trucks add column if not exists next_service_due_miles int;
alter table public.trucks add column if not exists maintenance_status text not null default 'good'
  check (maintenance_status in ('good', 'due_soon', 'overdue', 'out_of_service'));
alter table public.trucks add column if not exists maintenance_notes text;

update public.trucks set odometer_miles = mileage where odometer_miles is null and mileage is not null;

create table if not exists public.truck_maintenance_logs (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  truck_id text not null references public.trucks(id) on delete cascade,
  service_type text not null,
  service_date date not null,
  odometer_miles int,
  cost numeric(10,2),
  vendor text,
  notes text,
  next_due_date date,
  next_due_miles int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists truck_maintenance_logs_truck_idx
  on public.truck_maintenance_logs (company_id, truck_id, service_date desc);

-- ---------------------------------------------------------------------------
-- Dump site hours / closures
-- ---------------------------------------------------------------------------
alter table public.dump_sites add column if not exists hours_json jsonb not null default '{}'::jsonb;
alter table public.dump_sites add column if not exists is_closed boolean not null default false;
alter table public.dump_sites add column if not exists closure_reason text;
alter table public.dump_sites add column if not exists closure_starts_at timestamptz;
alter table public.dump_sites add column if not exists closure_ends_at timestamptz;

-- ---------------------------------------------------------------------------
-- Customer callbacks
-- ---------------------------------------------------------------------------
alter table public.customers add column if not exists callback_due_at timestamptz;
alter table public.customers add column if not exists callback_notes text;
alter table public.customers add column if not exists callback_status text not null default 'none'
  check (callback_status in ('none', 'due', 'completed', 'snoozed'));

create table if not exists public.customer_interactions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  profile_id text references public.profiles(id) on delete set null,
  interaction_type text not null
    check (interaction_type in ('call', 'text', 'email', 'note', 'review_request', 'follow_up')),
  direction text not null default 'outbound'
    check (direction in ('inbound', 'outbound', 'internal')),
  subject text,
  body text,
  follow_up_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_interactions_customer_idx
  on public.customer_interactions (company_id, customer_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.employee_timeclock enable row level security;
alter table public.truck_maintenance_logs enable row level security;
alter table public.customer_interactions enable row level security;

drop policy if exists "employee_timeclock_select" on public.employee_timeclock;
drop policy if exists "employee_timeclock_write" on public.employee_timeclock;
create policy "employee_timeclock_select" on public.employee_timeclock for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "employee_timeclock_write" on public.employee_timeclock for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());

drop policy if exists "truck_maintenance_logs_access" on public.truck_maintenance_logs;
create policy "truck_maintenance_logs_access" on public.truck_maintenance_logs for all
  using (company_id = public.morris_company_id() and public.is_planner_or_admin())
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());

drop policy if exists "customer_interactions_access" on public.customer_interactions;
create policy "customer_interactions_access" on public.customer_interactions for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());
