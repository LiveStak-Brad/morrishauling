-- Training courses and completions

create table if not exists public.training_courses (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  course_type text not null default 'video' check (course_type in ('video', 'quiz', 'document', 'in_person')),
  category text check (category in (
    'lifting', 'customer_service', 'trailer_loading', 'freon_handling',
    'appliance_removal', 'hazardous_waste', 'safety', 'equipment', 'driving', 'other'
  )),
  content_url text,
  content_html text,
  expiration_months int,
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_completions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  course_id text not null references public.training_courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  expires_at timestamptz,
  score numeric(5,2),
  passed boolean not null default true,
  certificate_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_quiz_attempts (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  course_id text not null references public.training_courses(id) on delete cascade,
  score numeric(5,2) not null,
  passed boolean not null,
  answers jsonb,
  attempted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists training_completions_emp_idx on public.training_completions(company_id, employee_id);
create index if not exists training_completions_expiry_idx on public.training_completions(company_id, expires_at);

alter table public.training_courses enable row level security;
alter table public.training_completions enable row level security;
alter table public.training_quiz_attempts enable row level security;

create policy "training_courses_read" on public.training_courses for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "training_courses_admin" on public.training_courses for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "training_completions_access" on public.training_completions for all
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  )
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "training_quiz_attempts_access" on public.training_quiz_attempts for all
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or employee_id = public.my_employee_id())
  )
  with check (company_id = public.morris_company_id() and public.is_staff());
