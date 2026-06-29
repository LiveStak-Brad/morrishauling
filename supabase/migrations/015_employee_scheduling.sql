-- Employee scheduling, availability, PTO

create table if not exists public.employee_availability (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_unavailability (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.time_off_requests (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  request_type text not null check (request_type in ('vacation', 'sick', 'personal', 'holiday', 'other')),
  start_date date not null,
  end_date date not null,
  hours_requested numeric(6,2),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'cancelled')),
  reviewed_by_profile_id text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_shifts (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  shift_date date not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  role text,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shift_swap_requests (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  requester_employee_id text not null references public.employees(id) on delete cascade,
  target_employee_id text references public.employees(id) on delete set null,
  shift_id text not null references public.employee_shifts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'cancelled')),
  reviewed_by_profile_id text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_shifts_emp_date_idx on public.employee_shifts(company_id, employee_id, shift_date);
create index if not exists time_off_requests_emp_idx on public.time_off_requests(company_id, employee_id, status);

alter table public.employee_availability enable row level security;
alter table public.employee_unavailability enable row level security;
alter table public.time_off_requests enable row level security;
alter table public.employee_shifts enable row level security;
alter table public.shift_swap_requests enable row level security;

create policy "employee_availability_access" on public.employee_availability for all
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  )
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "employee_unavailability_access" on public.employee_unavailability for all
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  )
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "time_off_requests_select" on public.time_off_requests for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  );
create policy "time_off_requests_write" on public.time_off_requests for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "employee_shifts_access" on public.employee_shifts for all
  using (
    company_id = public.morris_company_id()
    and (public.is_staff())
  )
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());

create policy "shift_swap_requests_access" on public.shift_swap_requests for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());
