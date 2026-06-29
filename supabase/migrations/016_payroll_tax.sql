-- Payroll and tax tracking

create table if not exists public.pay_periods (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'open' check (status in ('open', 'locked', 'exported', 'paid')),
  locked_at timestamptz,
  locked_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, start_date, end_date)
);

create table if not exists public.payroll_entries (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  pay_period_id text not null references public.pay_periods(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  regular_hours numeric(8,2) not null default 0,
  overtime_hours numeric(8,2) not null default 0,
  holiday_hours numeric(8,2) not null default 0,
  bonus_amount numeric(12,2) not null default 0,
  tips_amount numeric(12,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  per_job_incentive numeric(12,2) not null default 0,
  mileage_amount numeric(12,2) not null default 0,
  reimbursement_amount numeric(12,2) not null default 0,
  gross_pay numeric(12,2) not null default 0,
  federal_withholding numeric(12,2) not null default 0,
  state_withholding numeric(12,2) not null default 0,
  other_deductions numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pay_period_id, employee_id)
);

create table if not exists public.payroll_adjustments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  payroll_entry_id text not null references public.payroll_entries(id) on delete cascade,
  adjustment_type text not null check (adjustment_type in (
    'bonus', 'deduction', 'reimbursement', 'correction', 'tip', 'commission', 'mileage'
  )),
  amount numeric(12,2) not null,
  reason text not null,
  created_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payroll_exports (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  pay_period_id text not null references public.pay_periods(id) on delete cascade,
  export_format text not null check (export_format in ('csv', 'quickbooks', 'adp', 'gusto', 'paychex')),
  file_path text,
  file_name text,
  row_count int,
  exported_by_profile_id text references public.profiles(id) on delete set null,
  exported_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.contractor_1099_yearly (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  tax_year int not null,
  total_compensation numeric(14,2) not null default 0,
  other_income numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_id, tax_year)
);

create table if not exists public.payroll_tax_liabilities (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  pay_period_id text references public.pay_periods(id) on delete set null,
  liability_type text not null check (liability_type in (
    'fica_employer', 'futa', 'suta', 'workers_comp', 'other'
  )),
  amount numeric(12,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payroll_entries_period_idx on public.payroll_entries(company_id, pay_period_id);
create index if not exists pay_periods_dates_idx on public.pay_periods(company_id, start_date desc);

alter table public.pay_periods enable row level security;
alter table public.payroll_entries enable row level security;
alter table public.payroll_adjustments enable row level security;
alter table public.payroll_exports enable row level security;
alter table public.contractor_1099_yearly enable row level security;
alter table public.payroll_tax_liabilities enable row level security;

create policy "pay_periods_admin" on public.pay_periods for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "payroll_entries_admin" on public.payroll_entries for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "payroll_adjustments_admin" on public.payroll_adjustments for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "payroll_exports_admin" on public.payroll_exports for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "contractor_1099_admin" on public.contractor_1099_yearly for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "payroll_tax_liabilities_admin" on public.payroll_tax_liabilities for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

-- Link timesheet_approvals to pay_periods
alter table public.timesheet_approvals
  add constraint timesheet_approvals_pay_period_fk
  foreign key (pay_period_id) references public.pay_periods(id) on delete set null;
