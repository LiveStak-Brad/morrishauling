-- Performance, HR actions, KPI snapshots

create table if not exists public.performance_reviews (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  reviewer_profile_id text references public.profiles(id) on delete set null,
  review_period_start date not null,
  review_period_end date not null,
  overall_rating numeric(3,1),
  manager_rating numeric(3,1),
  customer_rating numeric(3,1),
  strengths text,
  improvements text,
  goals text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'acknowledged', 'archived')),
  submitted_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_promotions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  from_position_id text references public.positions(id) on delete set null,
  to_position_id text references public.positions(id) on delete set null,
  from_title text,
  to_title text not null,
  effective_date date not null,
  reason text,
  approved_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_raises (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  previous_rate numeric(12,2),
  new_rate numeric(12,2) not null,
  raise_percent numeric(5,2),
  effective_date date not null,
  reason text,
  review_id text references public.performance_reviews(id) on delete set null,
  approved_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.disciplinary_actions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  action_type text not null check (action_type in (
    'verbal_warning', 'written_warning', 'final_warning', 'suspension', 'investigation', 'termination_recommendation'
  )),
  incident_date date not null,
  description text not null,
  corrective_action text,
  suspension_start date,
  suspension_end date,
  issued_by_profile_id text references public.profiles(id) on delete set null,
  visible_to_supervisor boolean not null default false,
  status text not null default 'active' check (status in ('active', 'resolved', 'appealed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_investigations (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text references public.employees(id) on delete set null,
  complaint_type text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'closed')),
  findings text,
  resolution text,
  opened_by_profile_id text references public.profiles(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_notes (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  author_profile_id text references public.profiles(id) on delete set null,
  note_type text not null default 'general' check (note_type in ('general', 'manager', 'hr', 'recognition')),
  content text not null,
  is_private boolean not null default false,
  visible_to_supervisor boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_awards (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  award_type text not null,
  title text not null,
  description text,
  awarded_at date not null default current_date,
  awarded_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_kpi_snapshots (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  snapshot_date date not null,
  period_type text not null default 'daily' check (period_type in ('daily', 'weekly', 'monthly', 'lifetime')),
  jobs_completed int not null default 0,
  revenue_generated numeric(14,2) not null default 0,
  profit_generated numeric(14,2) not null default 0,
  upsells int not null default 0,
  google_reviews int not null default 0,
  attendance_rate numeric(5,2),
  late_arrivals int not null default 0,
  call_offs int not null default 0,
  damage_claims int not null default 0,
  callbacks int not null default 0,
  customer_rating numeric(3,1),
  manager_rating numeric(3,1),
  created_at timestamptz not null default now(),
  unique (company_id, employee_id, snapshot_date, period_type)
);

create index if not exists performance_reviews_emp_idx on public.performance_reviews(company_id, employee_id);
create index if not exists disciplinary_actions_emp_idx on public.disciplinary_actions(company_id, employee_id);
create index if not exists employee_kpi_snapshots_emp_idx on public.employee_kpi_snapshots(company_id, employee_id, snapshot_date desc);

alter table public.performance_reviews enable row level security;
alter table public.employee_promotions enable row level security;
alter table public.employee_raises enable row level security;
alter table public.disciplinary_actions enable row level security;
alter table public.hr_investigations enable row level security;
alter table public.hr_notes enable row level security;
alter table public.employee_awards enable row level security;
alter table public.employee_kpi_snapshots enable row level security;

create policy "performance_reviews_admin" on public.performance_reviews for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_promotions_admin" on public.employee_promotions for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_raises_admin" on public.employee_raises for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "disciplinary_actions_access" on public.disciplinary_actions for all
  using (company_id = public.morris_company_id() and public.is_hr())
  with check (company_id = public.morris_company_id() and public.is_hr());

create policy "hr_investigations_access" on public.hr_investigations for all
  using (company_id = public.morris_company_id() and public.is_hr())
  with check (company_id = public.morris_company_id() and public.is_hr());

create policy "hr_notes_access" on public.hr_notes for all
  using (
    company_id = public.morris_company_id()
    and (
      public.is_hr()
      or (visible_to_supervisor and public.is_planner_or_admin())
      or (not is_private and public.is_planner_or_admin())
    )
  )
  with check (company_id = public.morris_company_id() and public.is_hr());

create policy "employee_awards_read" on public.employee_awards for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "employee_awards_write" on public.employee_awards for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());

create policy "employee_kpi_snapshots_read" on public.employee_kpi_snapshots for select
  using (company_id = public.morris_company_id() and public.is_staff());
create policy "employee_kpi_snapshots_write" on public.employee_kpi_snapshots for all
  using (company_id = public.morris_company_id() and public.is_admin())
  with check (company_id = public.morris_company_id() and public.is_admin());
