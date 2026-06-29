-- Morris Hauling & Junk Removal — initial schema
-- Run in Supabase SQL Editor or: npm run db:migrate

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Companies (tenant config stored as JSON for pricing, fleet, branding, etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id text primary key,
  company_name text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Users / profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('customer', 'employee', 'planner', 'admin', 'platform_admin')),
  phone text,
  address text,
  employee_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_company_id_idx on public.profiles(company_id);
create index if not exists profiles_role_idx on public.profiles(company_id, role);

-- ---------------------------------------------------------------------------
-- Jobs (nested estimate, items, address stored in payload JSONB)
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  customer_id text not null,
  status text not null,
  junk_type text not null default '',
  scheduled_date date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_company_id_idx on public.jobs(company_id);
create index if not exists jobs_customer_id_idx on public.jobs(customer_id);
create index if not exists jobs_status_idx on public.jobs(company_id, status);
create index if not exists jobs_scheduled_date_idx on public.jobs(company_id, scheduled_date);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------
create table if not exists public.invoices (
  id text primary key,
  invoice_number text not null,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  customer_id text not null,
  estimate_amount numeric(12,2) not null default 0,
  adjustments jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  fees numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  deposit_paid numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  status text not null default 'draft',
  payment_status text not null default 'estimate_pending',
  due_date date,
  terms text,
  final_price_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_company_id_idx on public.invoices(company_id);
create index if not exists invoices_job_id_idx on public.invoices(job_id);
create index if not exists invoices_customer_id_idx on public.invoices(customer_id);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  invoice_id text references public.invoices(id) on delete set null,
  amount numeric(12,2) not null,
  method text not null,
  timing text not null,
  status text not null default 'pending',
  receipt_number text,
  created_at timestamptz not null default now()
);

create index if not exists payments_company_id_idx on public.payments(company_id);
create index if not exists payments_invoice_id_idx on public.payments(invoice_id);

-- ---------------------------------------------------------------------------
-- Financing requests
-- ---------------------------------------------------------------------------
create table if not exists public.financing_requests (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  invoice_id text references public.invoices(id) on delete set null,
  customer_id text not null,
  provider text not null default 'in_house',
  status text not null default 'pending',
  total_amount numeric(12,2) not null,
  down_payment numeric(12,2) not null default 0,
  number_of_payments int not null,
  payment_frequency text not null,
  preferred_first_payment_date date,
  employment_status text,
  monthly_income numeric(12,2),
  customer_notes text,
  internal_notes text,
  signature_placeholder text,
  terms_accepted boolean not null default false,
  denial_reason text,
  risk_score int,
  payment_schedule jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financing_company_id_idx on public.financing_requests(company_id);
create index if not exists financing_status_idx on public.financing_requests(company_id, status);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

drop trigger if exists invoices_updated_at on public.invoices;
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

drop trigger if exists financing_updated_at on public.financing_requests;
create trigger financing_updated_at before update on public.financing_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (dev-open policies — tighten when auth ships)
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.financing_requests enable row level security;

drop policy if exists "dev_all_companies" on public.companies;
create policy "dev_all_companies" on public.companies for all using (true) with check (true);

drop policy if exists "dev_all_profiles" on public.profiles;
create policy "dev_all_profiles" on public.profiles for all using (true) with check (true);

drop policy if exists "dev_all_jobs" on public.jobs;
create policy "dev_all_jobs" on public.jobs for all using (true) with check (true);

drop policy if exists "dev_all_invoices" on public.invoices;
create policy "dev_all_invoices" on public.invoices for all using (true) with check (true);

drop policy if exists "dev_all_payments" on public.payments;
create policy "dev_all_payments" on public.payments for all using (true) with check (true);

drop policy if exists "dev_all_financing" on public.financing_requests;
create policy "dev_all_financing" on public.financing_requests for all using (true) with check (true);
