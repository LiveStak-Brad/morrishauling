-- Private storage buckets + invoice PDF path

alter table public.invoices
  add column if not exists pdf_storage_path text;

-- Storage buckets (private — access via signed URLs / service role)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('job-photos', 'job-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('employee-documents', 'employee-documents', false, 20971520, array['image/jpeg', 'image/png', 'application/pdf']),
  ('applicant-documents', 'applicant-documents', false, 20971520, array['image/jpeg', 'image/png', 'application/pdf']),
  ('hr-documents', 'hr-documents', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png']),
  ('invoice-pdfs', 'invoice-pdfs', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Service role manages all bucket objects (app uses signed URLs for reads)
drop policy if exists "service_role_storage_all" on storage.objects;
create policy "service_role_storage_all" on storage.objects
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
