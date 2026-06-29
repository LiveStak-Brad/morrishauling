-- Time attendance: punches and adjustments

create table if not exists public.timeclock_punches (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  timeclock_id text not null references public.employee_timeclock(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  punch_type text not null check (punch_type in (
    'clock_in', 'clock_out', 'lunch_out', 'lunch_in', 'break_start', 'break_end'
  )),
  punched_at timestamptz not null,
  location jsonb,
  device_info jsonb,
  photo_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.timesheet_adjustments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  punch_id text references public.timeclock_punches(id) on delete set null,
  original_punched_at timestamptz,
  proposed_punched_at timestamptz not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by_profile_id text references public.profiles(id) on delete set null,
  reviewed_by_profile_id text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timesheet_approvals (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  pay_period_id text,
  shift_date date not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by_profile_id text references public.profiles(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_id, shift_date)
);

create index if not exists timeclock_punches_tc_idx on public.timeclock_punches(company_id, timeclock_id);
create index if not exists timeclock_punches_emp_idx on public.timeclock_punches(company_id, employee_id, punched_at desc);
create index if not exists timesheet_adjustments_emp_idx on public.timesheet_adjustments(company_id, employee_id, status);

alter table public.timeclock_punches enable row level security;
alter table public.timesheet_adjustments enable row level security;
alter table public.timesheet_approvals enable row level security;

create policy "timeclock_punches_select" on public.timeclock_punches for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or public.is_planner_or_admin() or employee_id = public.my_employee_id())
  );
create policy "timeclock_punches_insert" on public.timeclock_punches for insert
  with check (
    company_id = public.morris_company_id()
    and (public.is_admin() or public.is_planner_or_admin() or employee_id = public.my_employee_id())
  );

create policy "timesheet_adjustments_select" on public.timesheet_adjustments for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  );
create policy "timesheet_adjustments_write" on public.timesheet_adjustments for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "timesheet_approvals_access" on public.timesheet_approvals for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());
