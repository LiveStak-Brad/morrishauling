-- Onboarding templates and HR documents

create table if not exists public.onboarding_templates (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  employment_type text not null check (employment_type in (
    'w2_full_time', 'w2_part_time', '1099_contractor', 'seasonal', 'temporary', 'office_staff'
  )),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_template_items (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  template_id text not null references public.onboarding_templates(id) on delete cascade,
  item_key text not null,
  label text not null,
  description text,
  is_required boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_onboarding_items (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  template_item_id text references public.onboarding_template_items(id) on delete set null,
  item_key text not null,
  label text not null,
  status text not null default 'pending' check (status in ('pending', 'complete', 'waived')),
  is_required boolean not null default true,
  completed_at timestamptz,
  completed_by_profile_id text references public.profiles(id) on delete set null,
  waived_reason text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_templates (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  document_key text not null,
  name text not null,
  description text,
  version int not null default 1,
  employment_types text[] not null default '{}',
  content_html text,
  is_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, document_key, version)
);

create table if not exists public.employee_documents (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  template_id text references public.document_templates(id) on delete set null,
  document_key text not null,
  name text not null,
  version int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'signed', 'declined', 'expired')),
  storage_path text,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_signatures (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_document_id text not null references public.employee_documents(id) on delete cascade,
  signer_profile_id text references public.profiles(id) on delete set null,
  signer_name text not null,
  signed_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  signature_image_path text,
  pdf_storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_tax_profiles (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade unique,
  tax_classification text not null default 'w2' check (tax_classification in ('w2', '1099')),
  ssn_last4 text,
  ssn_encrypted text,
  federal_filing_status text,
  federal_allowances int,
  federal_extra_withholding numeric(10,2),
  state_code text,
  state_withholding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_onboarding_items_emp_idx on public.employee_onboarding_items(company_id, employee_id);
create index if not exists employee_documents_emp_idx on public.employee_documents(company_id, employee_id);

alter table public.onboarding_templates enable row level security;
alter table public.onboarding_template_items enable row level security;
alter table public.employee_onboarding_items enable row level security;
alter table public.document_templates enable row level security;
alter table public.employee_documents enable row level security;
alter table public.document_signatures enable row level security;
alter table public.employee_tax_profiles enable row level security;

create policy "onboarding_templates_admin" on public.onboarding_templates for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "onboarding_template_items_admin" on public.onboarding_template_items for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_onboarding_items_select" on public.employee_onboarding_items for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  );
create policy "employee_onboarding_items_write" on public.employee_onboarding_items for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "document_templates_admin" on public.document_templates for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_documents_select" on public.employee_documents for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  );
create policy "employee_documents_write" on public.employee_documents for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "document_signatures_access" on public.document_signatures for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "employee_tax_profiles_admin" on public.employee_tax_profiles for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());
