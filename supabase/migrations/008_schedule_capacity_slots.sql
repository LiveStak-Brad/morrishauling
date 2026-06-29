-- Schedule capacity slots for arrival calendar and dispatch planning

create table if not exists public.schedule_slots (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  slot_date date not null,
  window_label text not null,
  start_time time not null,
  end_time time not null,
  max_jobs integer not null default 4 check (max_jobs > 0),
  current_jobs integer not null default 0 check (current_jobs >= 0),
  service_area text,
  route_zone text,
  discount_amount numeric(10,2) not null default 0,
  discount_reason text,
  status text not null default 'available'
    check (status in ('available', 'limited', 'almost_full', 'full', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slot_date, window_label)
);

create index if not exists schedule_slots_company_date_idx
  on public.schedule_slots (company_id, slot_date);

alter table public.jobs add column if not exists selected_schedule_slot_id text
  references public.schedule_slots(id) on delete set null;
alter table public.jobs add column if not exists scheduled_window_label text;
alter table public.jobs add column if not exists flexible_discount_amount numeric(10,2) not null default 0;

alter table public.junk_removal_details add column if not exists selected_schedule_slot_id text;
alter table public.junk_removal_details add column if not exists scheduled_window_label text;
alter table public.junk_removal_details add column if not exists flexible_discount_amount numeric(10,2) not null default 0;

alter table public.schedule_slots enable row level security;

drop policy if exists "schedule_slots_select" on public.schedule_slots;
drop policy if exists "schedule_slots_write" on public.schedule_slots;

create policy "schedule_slots_select" on public.schedule_slots for select
  using (true);

create policy "schedule_slots_write" on public.schedule_slots for all
  using (company_id = public.morris_company_id() and public.is_planner_or_admin())
  with check (company_id = public.morris_company_id() and public.is_planner_or_admin());
