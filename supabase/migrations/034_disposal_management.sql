-- Disposal Management System: expanded facility fields + job disposal actuals

alter table public.dump_sites add column if not exists county text;
alter table public.dump_sites add column if not exists website text;
alter table public.dump_sites add column if not exists access_type text not null default 'both'
  check (access_type in ('public', 'commercial', 'both'));
alter table public.dump_sites add column if not exists rejected_materials text[] not null default '{}';
alter table public.dump_sites add column if not exists max_load_size text;
alter table public.dump_sites add column if not exists trailer_restrictions text;
alter table public.dump_sites add column if not exists truck_restrictions text;
alter table public.dump_sites add column if not exists weight_limit_tons numeric(8,2);
alter table public.dump_sites add column if not exists special_fees jsonb not null default '[]'::jsonb;
alter table public.dump_sites add column if not exists holiday_closures text[] not null default '{}';

-- Job disposal actuals (profitability tracking)
alter table public.junk_removal_details add column if not exists recommended_disposal_site_id text;
alter table public.junk_removal_details add column if not exists actual_disposal_site_id text;
alter table public.junk_removal_details add column if not exists actual_disposal_site_name text;
alter table public.junk_removal_details add column if not exists estimated_disposal_cost numeric(10,2);
alter table public.junk_removal_details add column if not exists estimated_disposal_fuel_cost numeric(10,2);
alter table public.junk_removal_details add column if not exists estimated_disposal_drive_minutes integer;
alter table public.junk_removal_details add column if not exists actual_disposal_cost numeric(10,2);
alter table public.junk_removal_details add column if not exists actual_disposal_weight_tons numeric(8,2);
alter table public.junk_removal_details add column if not exists disposal_completed_at timestamptz;
alter table public.junk_removal_details add column if not exists disposal_receipt_url text;
alter table public.junk_removal_details add column if not exists disposal_override_reason text;
alter table public.junk_removal_details add column if not exists disposal_notes text;

-- Expand reference facility metadata (county, access, materials taxonomy)
update public.dump_sites set
  access_type = coalesce(access_type, 'both'),
  accepted_materials = case id
    when 'ref-st-charles-recycle-works' then array['mixed_junk','household_trash','construction_demolition','yard_waste','furniture','appliances','mattresses','electronics','commercial_waste']
    when 'ref-wentzville-srf' then array['mixed_junk','household_trash','construction_demolition','yard_waste','commercial_waste']
    when 'ref-lincoln-county-transfer' then array['mixed_junk','household_trash','yard_waste','construction_demolition']
    when 'ref-warren-county-sanitary' then array['mixed_junk','construction_demolition','yard_waste','furniture','commercial_waste']
    when 'ref-franklin-county-sanitary' then array['mixed_junk','construction_demolition','yard_waste','commercial_waste']
    when 'ref-jefferson-county-sanitary' then array['mixed_junk','construction_demolition','yard_waste','furniture','commercial_waste']
    when 'ref-o-fallon-waste' then array['yard_waste','brush','leaves','recycling','cardboard','scrap_metal']
    when 'ref-lake-st-louis-transfer' then array['construction_demolition','concrete','mixed_junk','commercial_waste']
    else accepted_materials
  end,
  county = case id
    when 'ref-lincoln-county-transfer' then 'Lincoln'
    when 'ref-warren-county-sanitary' then 'Warren'
    when 'ref-franklin-county-sanitary' then 'Franklin'
    when 'ref-jefferson-county-sanitary' then 'Jefferson'
    when 'ref-st-charles-recycle-works' then 'St. Charles'
    when 'ref-wentzville-srf' then 'St. Charles'
    when 'ref-o-fallon-waste' then 'St. Charles'
    when 'ref-lake-st-louis-transfer' then 'St. Charles'
    else coalesce(county, 'St. Charles')
  end
where company_id = 'morris-hauling';

-- Disposal usage log for future reporting
create table if not exists public.disposal_events (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  dump_site_id text references public.dump_sites(id) on delete set null,
  dump_site_name text,
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  weight_tons numeric(8,2),
  drive_miles numeric(8,2),
  drive_minutes integer,
  fuel_cost numeric(10,2),
  receipt_url text,
  was_recommended boolean not null default false,
  override_reason text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists disposal_events_company_id_idx on public.disposal_events(company_id);
create index if not exists disposal_events_dump_site_id_idx on public.disposal_events(dump_site_id);
create index if not exists disposal_events_job_id_idx on public.disposal_events(job_id);

alter table public.disposal_events enable row level security;

drop policy if exists "disposal_events_access" on public.disposal_events;
create policy "disposal_events_access" on public.disposal_events for all
  using (company_id = current_setting('app.company_id', true))
  with check (company_id = current_setting('app.company_id', true));
