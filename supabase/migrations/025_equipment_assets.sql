-- Trackable equipment assets, maintenance, checkout, damage reports

create table if not exists public.equipment_assets (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  asset_id text not null,
  name text not null,
  category text not null,
  serial_number text,
  purchase_date date,
  purchase_price numeric(10,2),
  warranty_expires date,
  condition text not null default 'good' check (condition in ('excellent', 'good', 'fair', 'poor', 'out_of_service')),
  location text,
  assigned_employee_id text references public.employees(id) on delete set null,
  assigned_truck_id text,
  notes text,
  photo_paths jsonb not null default '[]'::jsonb,
  expected_life_months int,
  barcode text,
  status text not null default 'available' check (status in ('available', 'assigned', 'maintenance', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, asset_id)
);

create table if not exists public.equipment_maintenance_logs (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  asset_id text not null references public.equipment_assets(id) on delete cascade,
  service_date date not null,
  description text not null,
  cost numeric(10,2),
  vendor text,
  odometer_or_hours numeric(10,1),
  created_at timestamptz not null default now()
);

create table if not exists public.equipment_checkout_events (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  asset_id text not null references public.equipment_assets(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  checkout_at timestamptz not null default now(),
  return_requested_at timestamptz,
  returned_at timestamptz,
  condition_out text not null,
  condition_in text,
  employee_acknowledged_at timestamptz,
  signature_name text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.equipment_damage_reports (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  asset_id text not null references public.equipment_assets(id) on delete cascade,
  reported_by_employee_id text not null references public.employees(id) on delete cascade,
  checkout_event_id text references public.equipment_checkout_events(id) on delete set null,
  severity text not null check (severity in ('minor', 'moderate', 'major', 'total_loss')),
  description text not null,
  photo_paths jsonb not null default '[]'::jsonb,
  resolution text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipment_assets_assignee_idx on public.equipment_assets(company_id, assigned_employee_id);
create index if not exists equipment_damage_status_idx on public.equipment_damage_reports(company_id, status);

alter table public.equipment_assets enable row level security;
alter table public.equipment_maintenance_logs enable row level security;
alter table public.equipment_checkout_events enable row level security;
alter table public.equipment_damage_reports enable row level security;

create policy "equipment_assets_read" on public.equipment_assets for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "equipment_assets_admin" on public.equipment_assets for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "equipment_maint_read" on public.equipment_maintenance_logs for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "equipment_maint_admin" on public.equipment_maintenance_logs for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "equipment_checkout_access" on public.equipment_checkout_events for all
  using (company_id = public.morris_company_id() and (public.is_admin() or employee_id = public.my_employee_id()))
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "equipment_damage_read" on public.equipment_damage_reports for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "equipment_damage_write" on public.equipment_damage_reports for all
  using (company_id = public.morris_company_id() and (public.is_admin() or reported_by_employee_id = public.my_employee_id()))
  with check (company_id = public.morris_company_id() and public.is_staff());

-- Assets are admin-created only (see migration 030 for optional Flagship Truck placeholder).
