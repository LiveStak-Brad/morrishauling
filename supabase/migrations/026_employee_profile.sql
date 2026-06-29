-- Expanded employee profile: license, personal vehicle, notifications

create table if not exists public.employee_driver_credentials (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade unique,
  license_number text not null,
  license_class text,
  license_state text not null default 'MO',
  expires_at date not null,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_personal_vehicles (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  make text not null,
  model text not null,
  year int,
  plate text not null,
  insurance_expires date,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_notification_preferences (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade unique,
  channels jsonb not null default '{"email": true, "sms": false, "push": false}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.employee_uniform_sizes drop constraint if exists employee_uniform_sizes_item_type_check;

alter table public.employee_driver_credentials enable row level security;
alter table public.employee_personal_vehicles enable row level security;
alter table public.employee_notification_preferences enable row level security;

create policy "driver_creds_access" on public.employee_driver_credentials for all
  using (company_id = public.morris_company_id() and (public.is_admin() or employee_id = public.my_employee_id()))
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "personal_vehicle_access" on public.employee_personal_vehicles for all
  using (company_id = public.morris_company_id() and (public.is_admin() or employee_id = public.my_employee_id()))
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "notif_prefs_access" on public.employee_notification_preferences for all
  using (company_id = public.morris_company_id() and (public.is_admin() or employee_id = public.my_employee_id()))
  with check (company_id = public.morris_company_id() and public.is_staff());
