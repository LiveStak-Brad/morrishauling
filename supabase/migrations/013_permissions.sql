-- Granular permissions

create table if not exists public.permission_definitions (
  id text primary key,
  permission_key text not null unique,
  label text not null,
  category text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.workforce_role_permissions (
  id text primary key,
  workforce_role text not null,
  permission_key text not null references public.permission_definitions(permission_key) on delete cascade,
  created_at timestamptz not null default now(),
  unique (workforce_role, permission_key)
);

create table if not exists public.profile_permission_overrides (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  permission_key text not null references public.permission_definitions(permission_key) on delete cascade,
  granted boolean not null,
  created_at timestamptz not null default now(),
  unique (profile_id, permission_key)
);

-- Auth helpers
create or replace function public.is_hr()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select role in ('admin', 'hr') or workforce_role in ('owner', 'operations_manager', 'hr', 'office_admin')
    from public.profiles where id = auth.uid()::text limit 1
  ), false);
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select role = 'admin' or workforce_role = 'owner'
    from public.profiles where id = auth.uid()::text limit 1
  ), false);
$$;

create or replace function public.profile_workforce_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(workforce_role, case role
    when 'admin' then 'owner'
    when 'planner' then 'dispatcher'
    when 'employee' then 'employee'
    else role
  end) from public.profiles where id = auth.uid()::text limit 1;
$$;

create or replace function public.has_permission(p_key text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_role text;
  v_override boolean;
begin
  if public.is_owner() then return true; end if;

  select granted into v_override
  from public.profile_permission_overrides
  where profile_id = auth.uid()::text and permission_key = p_key;
  if v_override is not null then return v_override; end if;

  v_role := public.profile_workforce_role();
  return exists (
    select 1 from public.workforce_role_permissions
    where workforce_role = v_role and permission_key = p_key
  );
end;
$$;

-- Seed permissions
insert into public.permission_definitions (id, permission_key, label, category) values
  ('perm-1', 'hr.applicants.read', 'View applicants', 'ATS'),
  ('perm-2', 'hr.applicants.write', 'Manage applicants', 'ATS'),
  ('perm-3', 'hr.applicants.hire', 'Hire applicants', 'ATS'),
  ('perm-4', 'hr.employees.read', 'View employees', 'Employees'),
  ('perm-5', 'hr.employees.write', 'Manage employees', 'Employees'),
  ('perm-6', 'hr.employees.terminate', 'Terminate employees', 'Employees'),
  ('perm-7', 'hr.documents.read', 'View HR documents', 'Documents'),
  ('perm-8', 'hr.documents.manage', 'Manage HR documents', 'Documents'),
  ('perm-9', 'hr.documents.sign', 'Sign documents', 'Documents'),
  ('perm-10', 'hr.payroll.read', 'View payroll', 'Payroll'),
  ('perm-11', 'hr.payroll.export', 'Export payroll', 'Payroll'),
  ('perm-12', 'hr.payroll.lock', 'Lock pay periods', 'Payroll'),
  ('perm-13', 'hr.tax.read', 'View tax records', 'Tax'),
  ('perm-14', 'hr.notes.read', 'View HR notes', 'HR'),
  ('perm-15', 'hr.notes.private.read', 'View private HR notes', 'HR'),
  ('perm-16', 'hr.discipline.write', 'Write disciplinary actions', 'HR'),
  ('perm-17', 'timeclock.approve', 'Approve timesheets', 'Time'),
  ('perm-18', 'schedule.manage', 'Manage schedules', 'Schedule'),
  ('perm-19', 'equipment.assign', 'Assign equipment', 'Equipment'),
  ('perm-20', 'training.manage', 'Manage training', 'Training'),
  ('perm-21', 'performance.manage', 'Manage performance', 'Performance')
on conflict (permission_key) do nothing;

-- Owner gets all permissions
insert into public.workforce_role_permissions (id, workforce_role, permission_key)
select 'wrp-owner-' || id, 'owner', permission_key from public.permission_definitions
on conflict do nothing;

insert into public.workforce_role_permissions (id, workforce_role, permission_key) values
  ('wrp-hr-1', 'hr', 'hr.applicants.read'),
  ('wrp-hr-2', 'hr', 'hr.applicants.write'),
  ('wrp-hr-3', 'hr', 'hr.applicants.hire'),
  ('wrp-hr-4', 'hr', 'hr.employees.read'),
  ('wrp-hr-5', 'hr', 'hr.employees.write'),
  ('wrp-hr-6', 'hr', 'hr.employees.terminate'),
  ('wrp-hr-7', 'hr', 'hr.documents.read'),
  ('wrp-hr-8', 'hr', 'hr.documents.manage'),
  ('wrp-hr-9', 'hr', 'hr.payroll.read'),
  ('wrp-hr-10', 'hr', 'hr.tax.read'),
  ('wrp-hr-11', 'hr', 'hr.notes.read'),
  ('wrp-hr-12', 'hr', 'hr.notes.private.read'),
  ('wrp-hr-13', 'hr', 'hr.discipline.write'),
  ('wrp-hr-14', 'hr', 'training.manage'),
  ('wrp-hr-15', 'hr', 'performance.manage'),
  ('wrp-disp-1', 'dispatcher', 'hr.employees.read'),
  ('wrp-disp-2', 'dispatcher', 'schedule.manage'),
  ('wrp-disp-3', 'dispatcher', 'timeclock.approve'),
  ('wrp-disp-4', 'dispatcher', 'equipment.assign'),
  ('wrp-cl-1', 'crew_leader', 'hr.employees.read'),
  ('wrp-cl-2', 'crew_leader', 'timeclock.approve'),
  ('wrp-cl-3', 'crew_leader', 'schedule.manage'),
  ('wrp-emp-1', 'employee', 'hr.documents.sign')
on conflict do nothing;

alter table public.permission_definitions enable row level security;
alter table public.workforce_role_permissions enable row level security;
alter table public.profile_permission_overrides enable row level security;

create policy "permission_definitions_read" on public.permission_definitions for select
  using (auth.uid() is not null);
create policy "workforce_role_permissions_read" on public.workforce_role_permissions for select
  using (auth.uid() is not null);
create policy "profile_permission_overrides_admin" on public.profile_permission_overrides for all
  using (public.is_owner())
  with check (public.is_owner());
