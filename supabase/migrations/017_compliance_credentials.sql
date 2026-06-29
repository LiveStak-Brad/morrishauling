-- Compliance: credentials, insurance, incidents

create table if not exists public.employee_credentials (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  credential_type text not null check (credential_type in (
    'drivers_license', 'cdl', 'dot_medical', 'other'
  )),
  credential_number_masked text,
  issuing_state text,
  issued_at date,
  expires_at date,
  document_id text references public.employee_documents(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked', 'pending')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.insurance_policies (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text references public.employees(id) on delete set null,
  policy_type text not null check (policy_type in (
    'workers_comp', 'liability', 'auto', 'health', 'contractor_liability', 'other'
  )),
  provider text,
  policy_number text,
  coverage_amount numeric(14,2),
  effective_date date,
  expiration_date date,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled', 'pending')),
  document_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.safety_incidents (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text references public.employees(id) on delete set null,
  truck_id text references public.trucks(id) on delete set null,
  incident_type text not null check (incident_type in (
    'accident', 'injury', 'property_damage', 'near_miss', 'workers_comp_claim', 'other'
  )),
  incident_date timestamptz not null,
  location text,
  description text not null,
  severity text check (severity in ('minor', 'moderate', 'major', 'critical')),
  workers_comp_claim_number text,
  claim_status text check (claim_status in ('open', 'investigating', 'closed', 'denied')),
  estimated_cost numeric(12,2),
  reported_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_credentials_expiry_idx
  on public.employee_credentials(company_id, expires_at) where status = 'active';
create index if not exists insurance_policies_expiry_idx
  on public.insurance_policies(company_id, expiration_date) where status = 'active';
create index if not exists safety_incidents_emp_idx on public.safety_incidents(company_id, employee_id);

alter table public.employee_credentials enable row level security;
alter table public.insurance_policies enable row level security;
alter table public.safety_incidents enable row level security;

create policy "employee_credentials_access" on public.employee_credentials for all
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  )
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "insurance_policies_admin" on public.insurance_policies for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "safety_incidents_access" on public.safety_incidents for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_admin());
