-- Morris Hauling — Supabase Auth profiles + RLS
-- Run after 002_expand_operations_schema.sql

-- ---------------------------------------------------------------------------
-- Profiles: align with auth.users
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists status text not null default 'active';

update public.profiles set full_name = name where full_name is null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'employee', 'planner', 'admin'));

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('active', 'inactive', 'suspended'));

create index if not exists profiles_email_idx on public.profiles(email);

-- ---------------------------------------------------------------------------
-- Auth helper functions (security definer)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_id()
returns text language sql stable security definer set search_path = public as $$
  select auth.uid()::text;
$$;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()::text limit 1;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()::text limit 1), false);
$$;

create or replace function public.is_planner_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('planner', 'admin') from public.profiles where id = auth.uid()::text limit 1), false);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('employee', 'planner', 'admin') from public.profiles where id = auth.uid()::text limit 1), false);
$$;

create or replace function public.my_customer_id()
returns text language sql stable security definer set search_path = public as $$
  select id from public.customers where profile_id = auth.uid()::text limit 1;
$$;

create or replace function public.my_employee_id()
returns text language sql stable security definer set search_path = public as $$
  select e.id from public.employees e
  where e.profile_id = auth.uid()::text limit 1;
$$;

create or replace function public.morris_company_id()
returns text language sql stable as $$
  select 'morris-hauling'::text;
$$;

-- ---------------------------------------------------------------------------
-- Drop dev-open policies
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'companies','profiles','jobs','invoices','payments','financing_requests',
    'customers','employees','job_photos','job_notes','estimates','trucks',
    'trailers','dump_sites','service_areas','routes','route_stops',
    'job_assignments','activity_log','notifications','company_settings',
    'financing_payments'
  ] loop
    execute format('drop policy if exists "dev_all_%s" on public.%I', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles for select
  using (id = auth.uid()::text or public.is_admin());

create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid()::text or public.is_admin());

create policy "profiles_insert_admin" on public.profiles for insert
  with check (public.is_admin() or auth.uid()::text = id);

-- ---------------------------------------------------------------------------
-- Companies (read-only for authenticated Morris users)
-- ---------------------------------------------------------------------------
create policy "companies_select" on public.companies for select
  using (id = public.morris_company_id() and auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create policy "customers_select" on public.customers for select
  using (
    public.is_admin()
    or public.is_planner_or_admin()
    or (profile_id = auth.uid()::text)
  );

create policy "customers_insert" on public.customers for insert
  with check (
    company_id = public.morris_company_id()
    and (profile_id = auth.uid()::text or public.is_admin())
  );

create policy "customers_update" on public.customers for update
  using (profile_id = auth.uid()::text or public.is_admin());

-- ---------------------------------------------------------------------------
-- Employees
-- ---------------------------------------------------------------------------
create policy "employees_select" on public.employees for select
  using (public.is_staff() and company_id = public.morris_company_id());

create policy "employees_write" on public.employees for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------
create policy "jobs_select" on public.jobs for select
  using (
    company_id = public.morris_company_id()
    and (
      public.is_admin()
      or public.is_planner_or_admin()
      or customer_id = public.my_customer_id()
      or exists (
        select 1 from public.job_assignments ja
        where ja.job_id = jobs.id and ja.employee_id = public.my_employee_id()
      )
    )
  );

create policy "jobs_insert" on public.jobs for insert
  with check (
    company_id = public.morris_company_id()
    and (
      public.is_admin()
      or (public.current_user_role() = 'customer' and customer_id = public.my_customer_id())
    )
  );

create policy "jobs_update" on public.jobs for update
  using (
    company_id = public.morris_company_id()
    and (
      public.is_admin()
      or public.is_planner_or_admin()
      or exists (
        select 1 from public.job_assignments ja
        where ja.job_id = jobs.id and ja.employee_id = public.my_employee_id()
      )
      or (public.current_user_role() = 'customer' and customer_id = public.my_customer_id() and status in ('submitted', 'estimated'))
    )
  );

-- ---------------------------------------------------------------------------
-- Invoices, payments, financing
-- ---------------------------------------------------------------------------
create policy "invoices_select" on public.invoices for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or public.is_planner_or_admin() or customer_id = public.my_customer_id())
  );

create policy "invoices_write" on public.invoices for all
  using (public.is_admin() or public.is_planner_or_admin())
  with check (public.is_admin() or public.is_planner_or_admin());

create policy "payments_select" on public.payments for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or public.is_planner_or_admin() or customer_id = public.my_customer_id())
  );

create policy "payments_insert" on public.payments for insert
  with check (
    company_id = public.morris_company_id()
    and (public.is_admin() or customer_id = public.my_customer_id() or public.is_staff())
  );

create policy "financing_select" on public.financing_requests for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or customer_id = public.my_customer_id())
  );

create policy "financing_insert" on public.financing_requests for insert
  with check (
    company_id = public.morris_company_id()
    and (public.is_admin() or customer_id = public.my_customer_id())
  );

create policy "financing_update" on public.financing_requests for update
  using (public.is_admin()) with check (public.is_admin());

create policy "financing_payments_select" on public.financing_payments for select
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or customer_id = public.my_customer_id())
  );

-- ---------------------------------------------------------------------------
-- Job photos, notes, assignments, estimates
-- ---------------------------------------------------------------------------
create policy "job_photos_access" on public.job_photos for all
  using (
    company_id = public.morris_company_id()
    and (public.is_admin() or public.is_staff())
  ) with check (company_id = public.morris_company_id() and public.is_staff());

create policy "job_notes_access" on public.job_notes for all
  using (company_id = public.morris_company_id() and public.is_staff())
  with check (company_id = public.morris_company_id() and public.is_staff());

create policy "job_assignments_select" on public.job_assignments for select
  using (company_id = public.morris_company_id() and public.is_staff());

create policy "job_assignments_write" on public.job_assignments for all
  using (public.is_planner_or_admin()) with check (public.is_planner_or_admin());

create policy "estimates_access" on public.estimates for all
  using (company_id = public.morris_company_id() and (public.is_staff() or customer_id = public.my_customer_id()))
  with check (company_id = public.morris_company_id() and public.is_staff());

-- ---------------------------------------------------------------------------
-- Fleet & ops (planner/admin)
-- ---------------------------------------------------------------------------
create policy "trucks_access" on public.trucks for all
  using (company_id = public.morris_company_id() and public.is_planner_or_admin())
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());

create policy "trailers_access" on public.trailers for all
  using (company_id = public.morris_company_id() and public.is_planner_or_admin())
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());

create policy "dump_sites_access" on public.dump_sites for all
  using (company_id = public.morris_company_id() and public.is_planner_or_admin())
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());

create policy "service_areas_select" on public.service_areas for select
  using (company_id = public.morris_company_id() and auth.uid() is not null);

create policy "routes_access" on public.routes for all
  using (company_id = public.morris_company_id() and public.is_planner_or_admin())
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());

create policy "route_stops_access" on public.route_stops for all
  using (company_id = public.morris_company_id() and public.is_planner_or_admin())
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());

-- ---------------------------------------------------------------------------
-- Activity, notifications, settings
-- ---------------------------------------------------------------------------
create policy "activity_log_select" on public.activity_log for select
  using (company_id = public.morris_company_id() and public.is_staff());

create policy "notifications_select" on public.notifications for select
  using (
    company_id = public.morris_company_id()
    and (profile_id = auth.uid()::text or public.is_admin())
  );

create policy "company_settings_select" on public.company_settings for select
  using (company_id = public.morris_company_id() and public.is_admin());

create policy "company_settings_write" on public.company_settings for all
  using (public.is_admin()) with check (public.is_admin());
