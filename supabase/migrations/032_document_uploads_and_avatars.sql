-- Employee uploads, applicant documents, template files, avatars, audit log

alter table public.employees
  add column if not exists avatar_storage_path text;

alter table public.document_templates
  add column if not exists storage_path text;

alter table public.document_template_versions
  add column if not exists storage_path text;

create table if not exists public.employee_document_uploads (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  document_type text not null check (document_type in ('drivers_license', 'certification', 'other')),
  label text not null,
  storage_path text not null,
  mime_type text,
  file_size int,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected', 'superseded')),
  review_notes text,
  reviewed_by_profile_id text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  version int not null default 1,
  previous_upload_id text references public.employee_document_uploads(id) on delete set null,
  uploaded_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applicant_documents (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  applicant_id text not null references public.applicants(id) on delete cascade,
  application_id text references public.applications(id) on delete set null,
  document_type text not null check (document_type in ('resume', 'drivers_license', 'certification', 'supporting')),
  original_filename text,
  storage_path text not null,
  mime_type text,
  file_size int,
  uploaded_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.document_audit_log (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  notes text,
  actor_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists employee_document_uploads_emp_idx on public.employee_document_uploads(company_id, employee_id);
create index if not exists applicant_documents_applicant_idx on public.applicant_documents(company_id, applicant_id);
create index if not exists document_audit_log_entity_idx on public.document_audit_log(company_id, entity_type, entity_id);

alter table public.employee_document_uploads enable row level security;
alter table public.applicant_documents enable row level security;
alter table public.document_audit_log enable row level security;

create policy "employee_uploads_select" on public.employee_document_uploads for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  );
create policy "employee_uploads_write" on public.employee_document_uploads for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "applicant_documents_admin" on public.applicant_documents for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "document_audit_admin" on public.document_audit_log for select
  using (company_id = public.morris_company_id() and public.is_staff());
