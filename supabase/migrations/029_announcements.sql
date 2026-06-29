-- Company announcements for employee dashboard

create table if not exists public.company_announcements (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  title text not null,
  body_html text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists company_announcements_active_idx on public.company_announcements(company_id, is_active, published_at desc);

alter table public.company_announcements enable row level security;

create policy "announcements_read" on public.company_announcements for select
  using (company_id = public.morris_company_id() and public.is_staff() and is_active = true);
create policy "announcements_admin" on public.company_announcements for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

-- Announcements are admin-created only (no seed).
