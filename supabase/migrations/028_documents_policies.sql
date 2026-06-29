-- Policy document HTML seeds and version audit

create table if not exists public.document_template_versions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  template_id text not null references public.document_templates(id) on delete cascade,
  version int not null,
  content_html text not null,
  change_summary text,
  created_at timestamptz not null default now(),
  unique (template_id, version)
);

alter table public.document_signatures add column if not exists template_version int;
alter table public.document_signatures add column if not exists signature_image_path text;

update public.document_templates set content_html = '<h1>Employee Handbook</h1><p>Morris Hauling &amp; Junk Removal expects professional conduct, safety compliance, and respectful customer service at all times.</p><p>Employees must follow all company policies including uniform standards, timeclock accuracy, vehicle use rules, and harassment-free workplace requirements.</p>' where company_id = 'morris-hauling' and document_key = 'handbook';

update public.document_templates set content_html = '<h1>Safety Agreement</h1><p>All field employees must use required PPE, report injuries immediately, and complete assigned safety training before dispatch.</p>' where company_id = 'morris-hauling' and document_key = 'safety_agreement';

update public.document_templates set content_html = '<h1>Form W-4</h1><p>Complete federal withholding information accurately. Update HR when your tax situation changes.</p>' where company_id = 'morris-hauling' and document_key = 'w4';

update public.document_templates set content_html = '<h1>Form I-9</h1><p>Employment eligibility verification is required for all W-2 employees per federal law.</p>' where company_id = 'morris-hauling' and document_key = 'i9';

update public.document_templates set content_html = '<h1>Form W-9</h1><p>Contractors must provide accurate taxpayer identification for 1099 reporting.</p>' where company_id = 'morris-hauling' and document_key = 'w9';

update public.document_templates set content_html = '<h1>Independent Contractor Agreement</h1><p>Defines scope, payment terms, insurance requirements, and independent contractor status.</p>' where company_id = 'morris-hauling' and document_key = 'contractor_agreement';

alter table public.document_template_versions enable row level security;
create policy "doc_versions_read" on public.document_template_versions for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "doc_versions_admin" on public.document_template_versions for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());
