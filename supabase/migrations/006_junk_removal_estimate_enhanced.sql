-- Junk removal estimate enhancements: details table + estimate review fields

create table if not exists public.junk_removal_details (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null unique references public.jobs(id) on delete cascade,
  estimate_mode text not null default 'cleanout'
    check (estimate_mode in ('single_item', 'cleanout')),
  selected_items jsonb not null default '[]'::jsonb,
  selected_category text,
  load_percentage numeric(5,2),
  estimated_labor_minutes numeric(8,2),
  estimated_crew_size int default 2,
  stairs_flights int default 0,
  elevator_available boolean not null default false,
  basement boolean not null default false,
  attic boolean not null default false,
  long_carry_distance_ft numeric(8,2) default 0,
  heavy_items boolean not null default false,
  special_disposal boolean not null default false,
  dump_fee_estimate numeric(12,2),
  mileage_estimate numeric(10,2),
  fuel_adjustment numeric(12,2),
  priority_level text default 'standard'
    check (priority_level in ('flexible', 'standard', 'same_day', 'emergency')),
  review_required boolean not null default false,
  review_reasons text[] not null default '{}',
  review_status text not null default 'auto_ready',
  customer_pricing_breakdown jsonb not null default '[]'::jsonb,
  internal_cost_breakdown jsonb not null default '[]'::jsonb,
  estimated_profit numeric(12,2),
  estimated_margin numeric(6,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists junk_removal_details_job_id_idx on public.junk_removal_details(job_id);
create index if not exists junk_removal_details_company_id_idx on public.junk_removal_details(company_id);
create index if not exists junk_removal_details_review_idx on public.junk_removal_details(company_id, review_required);

alter table public.estimates add column if not exists estimate_type text;
alter table public.estimates add column if not exists review_status text default 'auto_ready';
alter table public.estimates add column if not exists pricing_breakdown jsonb not null default '[]'::jsonb;
alter table public.estimates add column if not exists internal_cost_breakdown jsonb not null default '[]'::jsonb;
alter table public.estimates add column if not exists estimated_profit numeric(12,2);
alter table public.estimates add column if not exists estimated_margin numeric(6,2);
alter table public.estimates add column if not exists review_reasons text[] not null default '{}';

alter table public.estimates drop constraint if exists estimates_review_status_check;
alter table public.estimates add constraint estimates_review_status_check
  check (review_status in ('auto_ready', 'needs_review', 'approved', 'adjusted', 'declined'));

alter table public.junk_removal_details drop constraint if exists junk_removal_details_review_status_check;
alter table public.junk_removal_details add constraint junk_removal_details_review_status_check
  check (review_status in ('auto_ready', 'needs_review', 'approved', 'adjusted', 'declined'));

alter table public.junk_removal_details enable row level security;

drop policy if exists "junk_removal_details_access" on public.junk_removal_details;
create policy "junk_removal_details_access" on public.junk_removal_details for all
  using (true) with check (true);
