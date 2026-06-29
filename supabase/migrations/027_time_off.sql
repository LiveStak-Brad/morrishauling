-- PTO balances, ledger, extended time off types

create table if not exists public.pto_policies (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  employment_type text,
  vacation_hours_per_year numeric(6,2) not null default 80,
  sick_hours_per_year numeric(6,2) not null default 40,
  personal_hours_per_year numeric(6,2) not null default 16,
  created_at timestamptz not null default now()
);

create table if not exists public.pto_balances (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  bucket text not null check (bucket in ('vacation', 'sick', 'personal')),
  balance_hours numeric(8,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (employee_id, bucket)
);

create table if not exists public.pto_ledger (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  bucket text not null,
  entry_type text not null check (entry_type in ('accrual', 'usage', 'adjustment')),
  hours numeric(8,2) not null,
  reference_id text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.time_off_requests drop constraint if exists time_off_requests_request_type_check;
alter table public.time_off_requests add constraint time_off_requests_request_type_check check (
  request_type in ('vacation', 'sick', 'personal', 'holiday', 'bereavement', 'jury_duty', 'military_leave', 'unpaid', 'personal_day', 'other')
);

alter table public.time_off_requests add column if not exists partial_day boolean not null default false;
alter table public.time_off_requests add column if not exists manager_notes text;

insert into public.pto_policies (id, company_id, name, employment_type, vacation_hours_per_year, sick_hours_per_year, personal_hours_per_year)
values ('pto-w2', 'morris-hauling', 'W2 Full-Time', 'w2', 80, 40, 16)
on conflict (id) do nothing;

alter table public.pto_policies enable row level security;
alter table public.pto_balances enable row level security;
alter table public.pto_ledger enable row level security;

create policy "pto_policies_read" on public.pto_policies for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "pto_balances_access" on public.pto_balances for all
  using (company_id = public.morris_company_id() and (public.is_admin() or employee_id = public.my_employee_id()))
  with check (company_id = public.morris_company_id() and public.is_staff());
create policy "pto_ledger_read" on public.pto_ledger for select
  using (company_id = public.morris_company_id() and (public.is_admin() or employee_id = public.my_employee_id()));
