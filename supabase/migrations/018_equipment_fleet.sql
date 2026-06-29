-- Equipment catalog, assignments, fleet history

create table if not exists public.equipment_catalog (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  item_type text not null check (item_type in (
    'uniform', 'key', 'fuel_card', 'credit_card', 'trailer', 'dolly',
    'ratchet_straps', 'appliance_straps', 'hand_truck', 'power_tool', 'tablet', 'phone', 'other'
  )),
  name text not null,
  sku text,
  description text,
  replacement_cost numeric(10,2),
  is_trackable boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_assignments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  catalog_item_id text references public.equipment_catalog(id) on delete set null,
  item_type text not null,
  item_name text not null,
  serial_number text,
  assigned_at timestamptz not null default now(),
  returned_at timestamptz,
  condition_on_assign text,
  condition_on_return text,
  status text not null default 'assigned' check (status in ('assigned', 'returned', 'lost', 'damaged')),
  replacement_cost numeric(10,2),
  notes text,
  assigned_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_fleet_history (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  truck_id text references public.trucks(id) on delete set null,
  trailer_id text references public.trailers(id) on delete set null,
  assignment_type text not null check (assignment_type in ('primary_truck', 'secondary_truck', 'primary_trailer', 'secondary_trailer', 'temporary')),
  effective_from date not null,
  effective_to date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists equipment_assignments_emp_idx on public.equipment_assignments(company_id, employee_id, status);
create index if not exists employee_fleet_history_emp_idx on public.employee_fleet_history(company_id, employee_id);

alter table public.equipment_catalog enable row level security;
alter table public.equipment_assignments enable row level security;
alter table public.employee_fleet_history enable row level security;

create policy "equipment_catalog_access" on public.equipment_catalog for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "equipment_assignments_select" on public.equipment_assignments for select
  using (
    company_id = public.morris_company_id()
    and (public.is_staff())
  );
create policy "equipment_assignments_write" on public.equipment_assignments for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_fleet_history_access" on public.employee_fleet_history for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_admin());
