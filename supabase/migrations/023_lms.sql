-- LMS extensions: lessons, quizzes, progress, assignments, acknowledgments

alter table public.training_courses
  add column if not exists passing_score_percent int not null default 80,
  add column if not exists max_quiz_attempts int not null default 3,
  add column if not exists requires_lesson_completion boolean not null default true,
  add column if not exists certificate_template_html text;

create table if not exists public.training_lessons (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  course_id text not null references public.training_courses(id) on delete cascade,
  title text not null,
  overview text,
  objectives text[] not null default '{}',
  content_html text not null default '',
  image_paths jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  min_read_seconds int not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_quiz_questions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  course_id text not null references public.training_courses(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.training_lesson_progress (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  lesson_id text not null references public.training_lessons(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (employee_id, lesson_id)
);

create table if not exists public.training_course_assignments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  course_id text not null references public.training_courses(id) on delete cascade,
  employee_id text references public.employees(id) on delete cascade,
  employment_type text,
  employee_role text,
  position_id text references public.positions(id) on delete set null,
  is_required boolean not null default true,
  due_date date,
  renewal_months int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_acknowledgments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  completion_id text not null references public.training_completions(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  course_id text not null references public.training_courses(id) on delete cascade,
  signer_name text not null,
  acknowledgment_text text not null,
  signed_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_retraining_events (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  course_id text not null references public.training_courses(id) on delete cascade,
  reason text not null,
  required_by_profile_id text references public.profiles(id) on delete set null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'waived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_lessons_course_idx on public.training_lessons(company_id, course_id, sort_order);
create index if not exists training_quiz_course_idx on public.training_quiz_questions(company_id, course_id, sort_order);
create index if not exists training_lesson_progress_emp_idx on public.training_lesson_progress(company_id, employee_id);
create index if not exists training_assignments_idx on public.training_course_assignments(company_id, course_id);
create index if not exists training_retraining_emp_idx on public.training_retraining_events(company_id, employee_id, status);

alter table public.training_lessons enable row level security;
alter table public.training_quiz_questions enable row level security;
alter table public.training_lesson_progress enable row level security;
alter table public.training_course_assignments enable row level security;
alter table public.training_acknowledgments enable row level security;
alter table public.training_retraining_events enable row level security;

create policy "training_lessons_read" on public.training_lessons for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "training_lessons_admin" on public.training_lessons for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "training_quiz_read" on public.training_quiz_questions for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "training_quiz_admin" on public.training_quiz_questions for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "training_progress_access" on public.training_lesson_progress for all
  using (company_id = public.morris_company_id() and (public.is_admin() or employee_id = public.my_employee_id()))
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "training_assignments_read" on public.training_course_assignments for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "training_assignments_admin" on public.training_course_assignments for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "training_ack_access" on public.training_acknowledgments for all
  using (company_id = public.morris_company_id() and (public.is_admin() or employee_id = public.my_employee_id()))
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "training_retraining_read" on public.training_retraining_events for select
  using (company_id = public.morris_company_id() and (public.is_admin() or employee_id = public.my_employee_id()));
create policy "training_retraining_admin" on public.training_retraining_events for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

-- Link onboarding checklist items to LMS courses
alter table public.employee_onboarding_items add column if not exists linked_course_id text references public.training_courses(id) on delete set null;
alter table public.onboarding_template_items add column if not exists linked_course_id text references public.training_courses(id) on delete set null;

-- Allow broader course categories for Morris field curriculum
alter table public.training_courses drop constraint if exists training_courses_category_check;
