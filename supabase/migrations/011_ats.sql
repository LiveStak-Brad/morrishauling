-- Applicant Tracking System

-- ---------------------------------------------------------------------------
-- Job postings
-- ---------------------------------------------------------------------------
create table if not exists public.job_postings (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  position_id text references public.positions(id) on delete set null,
  department_id text references public.departments(id) on delete set null,
  title text not null,
  slug text not null,
  description text not null,
  requirements text,
  employment_type text not null check (employment_type in (
    'w2_full_time', 'w2_part_time', '1099_contractor', 'seasonal', 'temporary', 'office_staff'
  )),
  pay_range_min numeric(10,2),
  pay_range_max numeric(10,2),
  pay_range_unit text default 'hourly' check (pay_range_unit in ('hourly', 'salary', 'annual')),
  location text,
  is_remote boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  published_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);

create index if not exists job_postings_status_idx on public.job_postings(company_id, status);

-- ---------------------------------------------------------------------------
-- Applicants & applications
-- ---------------------------------------------------------------------------
create table if not exists public.applicants (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  status text not null default 'applied' check (status in (
    'applied', 'phone_screen', 'interview_scheduled', 'interview_completed',
    'offer_sent', 'offer_accepted', 'offer_declined', 'rejected', 'hired'
  )),
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  date_of_birth date,
  military_status text,
  desired_pay numeric(10,2),
  availability text,
  transportation text,
  can_lift_100lbs boolean,
  can_drive_trucks boolean,
  has_cdl boolean,
  has_dot_medical boolean,
  drug_test_consent boolean not null default false,
  background_check_consent boolean not null default false,
  converted_employee_id text references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  applicant_id text not null references public.applicants(id) on delete cascade,
  job_posting_id text not null references public.job_postings(id) on delete cascade,
  status text not null default 'applied' check (status in (
    'applied', 'phone_screen', 'interview_scheduled', 'interview_completed',
    'offer_sent', 'offer_accepted', 'offer_declined', 'rejected', 'hired'
  )),
  cover_letter text,
  status_token text unique,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_employment_history (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  employer_name text not null,
  job_title text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  reason_for_leaving text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.application_references (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  name text not null,
  relationship text,
  phone text,
  email text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.application_education (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  institution text not null,
  degree text,
  field_of_study text,
  graduation_year int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.application_certifications (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  name text not null,
  issuing_body text,
  issued_at date,
  expires_at date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.application_documents (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  document_type text not null check (document_type in ('resume', 'drivers_license', 'other')),
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size_bytes int,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.application_status_history (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by_profile_id text references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_notes (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  author_profile_id text references public.profiles(id) on delete set null,
  note_type text not null default 'general' check (note_type in (
    'phone_screen', 'interview', 'reference_check', 'offer', 'general'
  )),
  content text not null,
  interview_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Link employees back to applications
alter table public.employees add constraint employees_source_application_fk
  foreign key (source_application_id) references public.applications(id) on delete set null;

create index if not exists applicants_status_idx on public.applicants(company_id, status);
create index if not exists applications_applicant_idx on public.applications(company_id, applicant_id);
create index if not exists applications_posting_idx on public.applications(company_id, job_posting_id);
create index if not exists interview_notes_app_idx on public.interview_notes(company_id, application_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.job_postings enable row level security;
alter table public.applicants enable row level security;
alter table public.applications enable row level security;
alter table public.application_employment_history enable row level security;
alter table public.application_references enable row level security;
alter table public.application_education enable row level security;
alter table public.application_certifications enable row level security;
alter table public.application_documents enable row level security;
alter table public.application_status_history enable row level security;
alter table public.interview_notes enable row level security;

create policy "job_postings_public_read" on public.job_postings for select
  using (company_id = public.morris_company_id() and status = 'published');
create policy "job_postings_admin" on public.job_postings for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "applicants_admin" on public.applicants for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "applications_admin" on public.applications for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "application_employment_history_admin" on public.application_employment_history for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "application_references_admin" on public.application_references for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "application_education_admin" on public.application_education for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "application_certifications_admin" on public.application_certifications for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "application_documents_admin" on public.application_documents for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "application_status_history_admin" on public.application_status_history for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "interview_notes_admin" on public.interview_notes for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());
