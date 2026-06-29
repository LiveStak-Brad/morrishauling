-- HR foundation: departments, positions, extended employees, profile extensions

-- ---------------------------------------------------------------------------
-- Departments & positions
-- ---------------------------------------------------------------------------
create table if not exists public.departments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.positions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  department_id text references public.departments(id) on delete set null,
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists departments_company_idx on public.departments(company_id);
create index if not exists positions_company_idx on public.positions(company_id, department_id);

-- ---------------------------------------------------------------------------
-- Extend profiles for workforce role
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists workforce_role text;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'employee', 'planner', 'admin', 'hr', 'office_admin'));

alter table public.profiles drop constraint if exists profiles_workforce_role_check;
alter table public.profiles add constraint profiles_workforce_role_check
  check (workforce_role is null or workforce_role in (
    'owner', 'operations_manager', 'dispatcher', 'office_admin', 'hr',
    'crew_leader', 'driver', 'employee'
  ));

-- ---------------------------------------------------------------------------
-- Extend employees
-- ---------------------------------------------------------------------------
alter table public.employees add column if not exists employee_number text;
alter table public.employees add column if not exists source_application_id text;
alter table public.employees add column if not exists lifecycle_status text not null default 'active';
alter table public.employees add column if not exists employment_type text;
alter table public.employees add column if not exists department_id text references public.departments(id) on delete set null;
alter table public.employees add column if not exists position_id text references public.positions(id) on delete set null;
alter table public.employees add column if not exists manager_employee_id text references public.employees(id) on delete set null;
alter table public.employees add column if not exists hire_date date;
alter table public.employees add column if not exists termination_date date;
alter table public.employees add column if not exists termination_reason text;
alter table public.employees add column if not exists date_of_birth date;
alter table public.employees add column if not exists address_line1 text;
alter table public.employees add column if not exists address_line2 text;
alter table public.employees add column if not exists city text;
alter table public.employees add column if not exists state text;
alter table public.employees add column if not exists zip text;
alter table public.employees add column if not exists overtime_eligible boolean not null default true;
alter table public.employees add column if not exists primary_truck_id text references public.trucks(id) on delete set null;
alter table public.employees add column if not exists primary_trailer_id text references public.trailers(id) on delete set null;
alter table public.employees add column if not exists secondary_truck_id text references public.trucks(id) on delete set null;
alter table public.employees add column if not exists secondary_trailer_id text references public.trailers(id) on delete set null;

alter table public.employees drop constraint if exists employees_lifecycle_status_check;
alter table public.employees add constraint employees_lifecycle_status_check
  check (lifecycle_status in ('onboarding', 'active', 'on_leave', 'terminated', 'archived'));

alter table public.employees drop constraint if exists employees_employment_type_check;
alter table public.employees add constraint employees_employment_type_check
  check (employment_type is null or employment_type in (
    'w2_full_time', 'w2_part_time', '1099_contractor', 'seasonal', 'temporary', 'office_staff'
  ));

create index if not exists employees_lifecycle_idx on public.employees(company_id, lifecycle_status);
create index if not exists employees_employment_type_idx on public.employees(company_id, employment_type);
create unique index if not exists employees_number_company_idx on public.employees(company_id, employee_number)
  where employee_number is not null;

-- ---------------------------------------------------------------------------
-- Employee profile extensions
-- ---------------------------------------------------------------------------
create table if not exists public.employee_emergency_contacts (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  name text not null,
  relationship text,
  phone text not null,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_addresses (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  zip text not null,
  effective_from date not null default current_date,
  effective_to date,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_pay_rates (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  pay_type text not null check (pay_type in ('hourly', 'salary', 'commission', 'bonus', 'mixed')),
  amount numeric(12,2) not null,
  commission_rate numeric(5,2),
  effective_from date not null,
  effective_to date,
  reason text,
  created_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_direct_deposits (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  bank_name text,
  routing_number_last4 text,
  account_number_last4 text,
  routing_number_encrypted text,
  account_number_encrypted text,
  allocation_percent numeric(5,2) not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_uniform_sizes (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  item_type text not null,
  size text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_emergency_contacts_emp_idx on public.employee_emergency_contacts(company_id, employee_id);
create index if not exists employee_addresses_emp_idx on public.employee_addresses(company_id, employee_id);
create index if not exists employee_pay_rates_emp_idx on public.employee_pay_rates(company_id, employee_id, effective_from desc);

-- ---------------------------------------------------------------------------
-- RLS hardening: junk_removal_details
-- ---------------------------------------------------------------------------
drop policy if exists "junk_removal_details_access" on public.junk_removal_details;
create policy "junk_removal_details_select" on public.junk_removal_details for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "junk_removal_details_write" on public.junk_removal_details for all
  using (company_id = public.morris_company_id() and public.is_planner_or_admin())
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());

-- ---------------------------------------------------------------------------
-- RLS for HR foundation tables
-- ---------------------------------------------------------------------------
alter table public.departments enable row level security;
alter table public.positions enable row level security;
alter table public.employee_emergency_contacts enable row level security;
alter table public.employee_addresses enable row level security;
alter table public.employee_pay_rates enable row level security;
alter table public.employee_direct_deposits enable row level security;
alter table public.employee_uniform_sizes enable row level security;

create policy "departments_access" on public.departments for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "positions_access" on public.positions for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_emergency_contacts_select" on public.employee_emergency_contacts for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  );
create policy "employee_emergency_contacts_write" on public.employee_emergency_contacts for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_addresses_select" on public.employee_addresses for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  );
create policy "employee_addresses_write" on public.employee_addresses for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_pay_rates_access" on public.employee_pay_rates for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_direct_deposits_access" on public.employee_direct_deposits for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_uniform_sizes_access" on public.employee_uniform_sizes for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_admin());
