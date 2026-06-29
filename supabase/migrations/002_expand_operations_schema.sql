-- Morris Hauling — expanded operations schema
-- Run after 001_initial_schema.sql

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  profile_id text references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  address text,
  city text,
  state text,
  zip text,
  notes text,
  preferred_contact_method text default 'phone' check (
    preferred_contact_method in ('phone', 'email', 'text')
  ),
  lifetime_value numeric(12,2) not null default 0,
  total_jobs int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_company_id_idx on public.customers(company_id);
create index if not exists customers_email_idx on public.customers(company_id, email);

-- ---------------------------------------------------------------------------
-- Employees
-- ---------------------------------------------------------------------------
create table if not exists public.employees (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  profile_id text references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  role text not null check (role in ('driver', 'helper', 'lead', 'planner', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive', 'on_leave')),
  pay_type text default 'hourly' check (pay_type in ('hourly', 'salary', 'commission', 'mixed')),
  hourly_rate numeric(10,2),
  commission_rate numeric(5,2),
  driver_license_on_file boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_company_id_idx on public.employees(company_id);
create index if not exists employees_status_idx on public.employees(company_id, status);

-- ---------------------------------------------------------------------------
-- Expand jobs
-- ---------------------------------------------------------------------------
alter table public.jobs add column if not exists service_type text;
alter table public.jobs add column if not exists address text;
alter table public.jobs add column if not exists city text;
alter table public.jobs add column if not exists state text;
alter table public.jobs add column if not exists zip text;
alter table public.jobs add column if not exists latitude numeric(10,7);
alter table public.jobs add column if not exists longitude numeric(10,7);
alter table public.jobs add column if not exists preferred_date date;
alter table public.jobs add column if not exists scheduled_start timestamptz;
alter table public.jobs add column if not exists scheduled_end timestamptz;
alter table public.jobs add column if not exists load_percentage numeric(5,2);
alter table public.jobs add column if not exists estimated_price numeric(12,2);
alter table public.jobs add column if not exists final_price numeric(12,2);
alter table public.jobs add column if not exists payment_status text default 'estimate_pending';
alter table public.jobs add column if not exists access_details jsonb not null default '{}'::jsonb;
alter table public.jobs add column if not exists item_list jsonb not null default '[]'::jsonb;
alter table public.jobs add column if not exists internal_notes text;
alter table public.jobs add column if not exists customer_notes text;

update public.jobs set service_type = junk_type where service_type is null and junk_type is not null;

-- ---------------------------------------------------------------------------
-- Job photos
-- ---------------------------------------------------------------------------
create table if not exists public.job_photos (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  uploaded_by_profile_id text references public.profiles(id) on delete set null,
  photo_url text not null,
  photo_type text not null check (
    photo_type in ('customer_upload', 'before', 'after', 'damage', 'dump_receipt')
  ),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists job_photos_job_id_idx on public.job_photos(job_id);

-- ---------------------------------------------------------------------------
-- Job notes
-- ---------------------------------------------------------------------------
create table if not exists public.job_notes (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  created_by_profile_id text references public.profiles(id) on delete set null,
  note_type text not null check (
    note_type in ('customer', 'employee', 'admin', 'system')
  ),
  note text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists job_notes_job_id_idx on public.job_notes(job_id);

-- ---------------------------------------------------------------------------
-- Estimates
-- ---------------------------------------------------------------------------
create table if not exists public.estimates (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  customer_id text references public.customers(id) on delete set null,
  estimate_number text not null,
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'accepted', 'declined', 'expired', 'converted')
  ),
  base_amount numeric(12,2) not null default 0,
  adjustments_total numeric(12,2) not null default 0,
  estimated_total numeric(12,2) not null default 0,
  final_amount numeric(12,2),
  load_percentage numeric(5,2),
  labor_hours_estimate numeric(6,2),
  crew_size int default 2,
  disclaimer_accepted boolean not null default false,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimates_job_id_idx on public.estimates(job_id);
create index if not exists estimates_company_id_idx on public.estimates(company_id);

-- ---------------------------------------------------------------------------
-- Trucks
-- ---------------------------------------------------------------------------
create table if not exists public.trucks (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  make text,
  model text,
  year int,
  license_plate text,
  vin text,
  status text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  mileage int default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trucks_company_id_idx on public.trucks(company_id);

-- ---------------------------------------------------------------------------
-- Trailers
-- ---------------------------------------------------------------------------
create table if not exists public.trailers (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  trailer_type text default 'dump',
  capacity_cubic_yards numeric(8,2),
  max_weight_lbs int,
  license_plate text,
  status text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trailers_company_id_idx on public.trailers(company_id);

-- ---------------------------------------------------------------------------
-- Dump sites
-- ---------------------------------------------------------------------------
create table if not exists public.dump_sites (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  address text not null,
  city text,
  state text,
  zip text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  phone text,
  accepted_materials text[] not null default '{}',
  fee_type text not null default 'flat' check (
    fee_type in ('flat', 'weight', 'volume', 'mixed')
  ),
  base_fee numeric(10,2),
  per_ton_fee numeric(10,2),
  hours text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dump_sites_company_id_idx on public.dump_sites(company_id);

-- ---------------------------------------------------------------------------
-- Service areas
-- ---------------------------------------------------------------------------
create table if not exists public.service_areas (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  county text,
  city text,
  state text default 'MO',
  zip_codes text[] not null default '{}',
  base_trip_fee numeric(10,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_areas_company_id_idx on public.service_areas(company_id);

-- ---------------------------------------------------------------------------
-- Routes
-- ---------------------------------------------------------------------------
create table if not exists public.routes (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  route_date date not null,
  truck_id text references public.trucks(id) on delete set null,
  trailer_id text references public.trailers(id) on delete set null,
  assigned_driver_id text references public.employees(id) on delete set null,
  status text not null default 'planned' check (
    status in ('planned', 'in_progress', 'completed', 'cancelled')
  ),
  start_location jsonb,
  end_location jsonb,
  estimated_miles numeric(8,2),
  estimated_hours numeric(6,2),
  actual_miles numeric(8,2),
  actual_hours numeric(6,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routes_company_date_idx on public.routes(company_id, route_date);

-- ---------------------------------------------------------------------------
-- Route stops
-- ---------------------------------------------------------------------------
create table if not exists public.route_stops (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  route_id text not null references public.routes(id) on delete cascade,
  job_id text references public.jobs(id) on delete set null,
  dump_site_id text references public.dump_sites(id) on delete set null,
  stop_type text not null check (
    stop_type in ('job', 'dump', 'fuel', 'break', 'start', 'end')
  ),
  stop_order int not null,
  address text,
  estimated_arrival timestamptz,
  actual_arrival timestamptz,
  estimated_load_percentage_after_stop numeric(5,2),
  status text not null default 'pending' check (
    status in ('pending', 'en_route', 'arrived', 'completed', 'skipped')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists route_stops_route_id_idx on public.route_stops(route_id);

-- ---------------------------------------------------------------------------
-- Job assignments
-- ---------------------------------------------------------------------------
create table if not exists public.job_assignments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  role text not null check (role in ('driver', 'helper', 'lead')),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (job_id, employee_id)
);

create index if not exists job_assignments_job_id_idx on public.job_assignments(job_id);

-- ---------------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------------
create table if not exists public.activity_log (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  actor_profile_id text references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_company_id_idx on public.activity_log(company_id, created_at desc);
create index if not exists activity_log_entity_idx on public.activity_log(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  profile_id text references public.profiles(id) on delete set null,
  customer_id text references public.customers(id) on delete set null,
  title text not null,
  message text not null,
  notification_type text not null default 'info',
  status text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_profile_idx on public.notifications(profile_id, status);

-- ---------------------------------------------------------------------------
-- Company settings
-- ---------------------------------------------------------------------------
create table if not exists public.company_settings (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, setting_key)
);

create index if not exists company_settings_company_id_idx on public.company_settings(company_id);

-- ---------------------------------------------------------------------------
-- Expand invoices
-- ---------------------------------------------------------------------------
alter table public.invoices add column if not exists estimate_id text references public.estimates(id) on delete set null;
alter table public.invoices add column if not exists adjustments_total numeric(12,2) default 0;
alter table public.invoices add column if not exists tax numeric(12,2) default 0;
alter table public.invoices add column if not exists paid_at timestamptz;

-- ---------------------------------------------------------------------------
-- Expand payments
-- ---------------------------------------------------------------------------
alter table public.payments add column if not exists customer_id text;
alter table public.payments add column if not exists transaction_id text;
alter table public.payments add column if not exists collected_by_employee_id text references public.employees(id) on delete set null;
alter table public.payments add column if not exists notes text;
alter table public.payments add column if not exists updated_at timestamptz default now();

-- ---------------------------------------------------------------------------
-- Expand financing_requests
-- ---------------------------------------------------------------------------
alter table public.financing_requests add column if not exists requested_amount numeric(12,2);
alter table public.financing_requests add column if not exists payment_count int;
alter table public.financing_requests add column if not exists first_payment_date date;
alter table public.financing_requests add column if not exists admin_notes text;
alter table public.financing_requests add column if not exists approved_by_profile_id text references public.profiles(id) on delete set null;
alter table public.financing_requests add column if not exists approved_at timestamptz;
alter table public.financing_requests add column if not exists denied_at timestamptz;

update public.financing_requests
set
  requested_amount = coalesce(requested_amount, total_amount),
  payment_count = coalesce(payment_count, number_of_payments),
  first_payment_date = coalesce(first_payment_date, preferred_first_payment_date),
  admin_notes = coalesce(admin_notes, internal_notes)
where requested_amount is null or payment_count is null;

-- ---------------------------------------------------------------------------
-- Financing payments (installment schedule)
-- ---------------------------------------------------------------------------
create table if not exists public.financing_payments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  financing_request_id text not null references public.financing_requests(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  invoice_id text references public.invoices(id) on delete set null,
  payment_number int not null,
  amount_due numeric(12,2) not null,
  due_date date not null,
  amount_paid numeric(12,2) not null default 0,
  paid_at timestamptz,
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'late', 'missed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financing_payments_request_idx on public.financing_payments(financing_request_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers (new tables)
-- ---------------------------------------------------------------------------
drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists employees_updated_at on public.employees;
create trigger employees_updated_at before update on public.employees
  for each row execute function public.set_updated_at();

drop trigger if exists estimates_updated_at on public.estimates;
create trigger estimates_updated_at before update on public.estimates
  for each row execute function public.set_updated_at();

drop trigger if exists trucks_updated_at on public.trucks;
create trigger trucks_updated_at before update on public.trucks
  for each row execute function public.set_updated_at();

drop trigger if exists trailers_updated_at on public.trailers;
create trigger trailers_updated_at before update on public.trailers
  for each row execute function public.set_updated_at();

drop trigger if exists dump_sites_updated_at on public.dump_sites;
create trigger dump_sites_updated_at before update on public.dump_sites
  for each row execute function public.set_updated_at();

drop trigger if exists service_areas_updated_at on public.service_areas;
create trigger service_areas_updated_at before update on public.service_areas
  for each row execute function public.set_updated_at();

drop trigger if exists routes_updated_at on public.routes;
create trigger routes_updated_at before update on public.routes
  for each row execute function public.set_updated_at();

drop trigger if exists route_stops_updated_at on public.route_stops;
create trigger route_stops_updated_at before update on public.route_stops
  for each row execute function public.set_updated_at();

drop trigger if exists company_settings_updated_at on public.company_settings;
create trigger company_settings_updated_at before update on public.company_settings
  for each row execute function public.set_updated_at();

drop trigger if exists financing_payments_updated_at on public.financing_payments;
create trigger financing_payments_updated_at before update on public.financing_payments
  for each row execute function public.set_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS (dev-open — tighten before production)
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.employees enable row level security;
alter table public.job_photos enable row level security;
alter table public.job_notes enable row level security;
alter table public.estimates enable row level security;
alter table public.trucks enable row level security;
alter table public.trailers enable row level security;
alter table public.dump_sites enable row level security;
alter table public.service_areas enable row level security;
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;
alter table public.job_assignments enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;
alter table public.company_settings enable row level security;
alter table public.financing_payments enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'customers','employees','job_photos','job_notes','estimates','trucks','trailers',
    'dump_sites','service_areas','routes','route_stops','job_assignments',
    'activity_log','notifications','company_settings','financing_payments'
  ]
  loop
    execute format('drop policy if exists "dev_all_%s" on public.%I', t, t);
    execute format(
      'create policy "dev_all_%s" on public.%I for all using (true) with check (true)',
      t, t
    );
  end loop;
end $$;
