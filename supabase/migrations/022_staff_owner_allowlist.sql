-- Restrict owner/admin staff roles to wcba.mo@gmail.com (Morris owner account).
-- Other profiles with admin/hr/office_admin are demoted to planner or employee.

-- Demote non-owner privileged roles
update public.profiles
set
  role = case
    when exists (
      select 1 from public.employees e where e.profile_id = profiles.id and e.role in ('planner', 'admin')
    ) then 'planner'
    else 'employee'
  end,
  workforce_role = case
    when exists (
      select 1 from public.employees e where e.profile_id = profiles.id and e.role in ('planner', 'admin')
    ) then 'dispatcher'
    else 'employee'
  end,
  updated_at = now()
where role in ('admin', 'hr', 'office_admin')
  and lower(trim(email)) <> lower('wcba.mo@gmail.com');

-- Ensure owner account has full admin access
update public.profiles
set
  role = 'admin',
  workforce_role = 'owner',
  status = 'active',
  updated_at = now()
where lower(trim(email)) = lower('wcba.mo@gmail.com');

-- Align is_owner() with email allowlist (single-tenant Morris)
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select lower(trim(email)) = lower('wcba.mo@gmail.com')
      and role in ('admin', 'hr', 'office_admin')
    from public.profiles where id = auth.uid()::text limit 1
  ), false);
$$;

create or replace function public.is_hr()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select lower(trim(email)) = lower('wcba.mo@gmail.com')
      and role in ('admin', 'hr', 'office_admin')
    from public.profiles where id = auth.uid()::text limit 1
  ), false);
$$;
